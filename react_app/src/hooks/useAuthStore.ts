import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { UserProfile } from '@/types/user'

interface AuthStore {
  user: UserProfile | null
  session: Session | null
  devToken: string | null
  activeRole: 'client' | 'freelancer'
  isAuthenticated: boolean
  isLoading: boolean
  initialized: boolean

  // Actions
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (
    email: string,
    password: string,
    metadata: { full_name: string; organization?: string; role?: 'client' | 'freelancer' }
  ) => Promise<{ success: boolean; error?: string; requiresConfirmation?: boolean }>
  signInWithDevRole: (role: 'client' | 'freelancer') => void
  signOut: () => Promise<void>
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>
  resendVerification: (email: string) => Promise<{ success: boolean; error?: string }>
  getAccessToken: () => string | null
  setActiveRole: (role: 'client' | 'freelancer') => void
  toggleActiveRole: () => void
}

const mapSupabaseUser = (user: User, fallbackRole: 'client' | 'freelancer' = 'client'): UserProfile => {
  const metadata = user.user_metadata || {}
  const rawRole = metadata.role
  const role: 'client' | 'freelancer' =
    rawRole === 'freelancer' || rawRole === 'supplier' ? 'freelancer' : fallbackRole
  return {
    id: user.id,
    email: user.email || '',
    name: metadata.full_name || metadata.name || user.email?.split('@')[0] || 'User',
    role,
    organization: metadata.organization || undefined,
    avatarUrl: metadata.avatar_url || undefined,
    createdAt: user.created_at,
  }
}

const DEV_CLIENT_USER: UserProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'elena@acmeglobal.com',
  name: 'Elena Rostova',
  role: 'client',
  organization: 'Acme Global Ventures LLC',
}

const DEV_FREELANCER_USER: UserProfile = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'tariro@devstudio.co.zw',
  name: 'Tariro Moyo',
  role: 'freelancer',
  organization: 'DevStudio Zimbabwe',
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  devToken: localStorage.getItem('tb_dev_token'),
  activeRole: (localStorage.getItem('tb_active_role') as 'client' | 'freelancer') || 'client',
  isAuthenticated: false,
  isLoading: true,
  initialized: false,

  initialize: async () => {
    // 1. Check for stored Dev Session first if offline or in dev mode
    const storedDevToken = localStorage.getItem('tb_dev_token')
    const storedRole = (localStorage.getItem('tb_active_role') as 'client' | 'freelancer') || 'client'

    if (storedDevToken) {
      const devUser = storedRole === 'freelancer' ? DEV_FREELANCER_USER : DEV_CLIENT_USER
      set({
        user: devUser,
        devToken: storedDevToken,
        activeRole: storedRole,
        isAuthenticated: true,
        isLoading: false,
        initialized: true,
      })
      return
    }

    // 2. Check Supabase session if configured
    if (isSupabaseConfigured) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error

        if (session && session.user) {
          const profile = mapSupabaseUser(session.user, storedRole)
          set({
            session,
            user: profile,
            activeRole: profile.role === 'freelancer' ? 'freelancer' : 'client',
            isAuthenticated: true,
            isLoading: false,
            initialized: true,
          })
        } else {
          set({
            session: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            initialized: true,
          })
        }

        // Register listener for auth state changes
        supabase.auth.onAuthStateChange((_event, session) => {
          if (session && session.user) {
            const role = get().activeRole
            const profile = mapSupabaseUser(session.user, role)
            set({
              session,
              user: profile,
              activeRole: profile.role === 'freelancer' ? 'freelancer' : 'client',
              isAuthenticated: true,
              isLoading: false,
            })
          } else if (!get().devToken) {
            set({
              session: null,
              user: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        })
        return
      } catch (err) {
        console.warn('Supabase auth getSession warning, falling back to local auth state:', err)
      }
    }

    set({
      session: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      initialized: true,
    })
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true })

    // Check if this is a demo email first for instant 1-click test flow
    if (email === 'elena@acmeglobal.com' && (password === 'password123' || password === 'demo123')) {
      get().signInWithDevRole('client')
      set({ isLoading: false })
      return { success: true }
    }
    if (email === 'tariro@devstudio.co.zw' && (password === 'password123' || password === 'demo123')) {
      get().signInWithDevRole('freelancer')
      set({ isLoading: false })
      return { success: true }
    }

    if (!isSupabaseConfigured) {
      set({ isLoading: false })
      return { success: false, error: 'Supabase authentication is not configured in environment variables.' }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        set({ isLoading: false })
        return { success: false, error: error.message }
      }

      if (data.session && data.user) {
        localStorage.removeItem('tb_dev_token')
        const profile = mapSupabaseUser(data.user)
        localStorage.setItem('tb_active_role', profile.role)
        set({
          session: data.session,
          user: profile,
          devToken: null,
          activeRole: profile.role === 'freelancer' ? 'freelancer' : 'client',
          isAuthenticated: true,
          isLoading: false,
        })
        return { success: true }
      }

      set({ isLoading: false })
      return { success: false, error: 'No active session returned.' }
    } catch (err: any) {
      set({ isLoading: false })
      return { success: false, error: err?.message || 'Authentication error occurred.' }
    }
  },

  signUp: async (email, password, metadata) => {
    set({ isLoading: true })

    if (!isSupabaseConfigured) {
      set({ isLoading: false })
      return { success: false, error: 'Supabase authentication is not configured.' }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata.full_name,
            organization: metadata.organization || '',
            role: metadata.role || 'client',
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        set({ isLoading: false })
        return { success: false, error: error.message }
      }

      // If session is returned immediately (email confirmation disabled in Supabase project)
      if (data.session && data.user) {
        localStorage.removeItem('tb_dev_token')
        const profile = mapSupabaseUser(data.user, metadata.role)
        localStorage.setItem('tb_active_role', profile.role)
        set({
          session: data.session,
          user: profile,
          devToken: null,
          activeRole: profile.role === 'freelancer' ? 'freelancer' : 'client',
          isAuthenticated: true,
          isLoading: false,
        })
        return { success: true, requiresConfirmation: false }
      }

      // Email confirmation required
      set({ isLoading: false })
      return { success: true, requiresConfirmation: true }
    } catch (err: any) {
      set({ isLoading: false })
      return { success: false, error: err?.message || 'Failed to create account.' }
    }
  },

  signInWithDevRole: (role: 'client' | 'freelancer') => {
    const devToken = `dev-user-${role}`
    const devUser = role === 'freelancer' ? DEV_FREELANCER_USER : DEV_CLIENT_USER
    localStorage.setItem('tb_dev_token', devToken)
    localStorage.setItem('tb_active_role', role)

    set({
      session: null,
      devToken,
      user: devUser,
      activeRole: role,
      isAuthenticated: true,
      isLoading: false,
    })
  },

  signOut: async () => {
    localStorage.removeItem('tb_dev_token')
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut()
      } catch (err) {
        console.warn('Error signing out from Supabase:', err)
      }
    }
    set({
      user: null,
      session: null,
      devToken: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  resetPasswordForEmail: async (email: string) => {
    if (!isSupabaseConfigured) {
      return { success: true } // Mock success for dev/offline testing
    }

    try {
      const redirectUrl = `${window.location.origin}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })
      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to send reset instructions.' }
    }
  },

  updatePassword: async (password: string) => {
    if (!isSupabaseConfigured) {
      return { success: true } // Mock success
    }

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update password.' }
    }
  },

  resendVerification: async (email: string) => {
    if (!isSupabaseConfigured) {
      return { success: true }
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to resend email.' }
    }
  },

  getAccessToken: () => {
    const { session, devToken } = get()
    if (session?.access_token) return session.access_token
    if (devToken) return devToken
    return null
  },

  setActiveRole: (role: 'client' | 'freelancer') => {
    localStorage.setItem('tb_active_role', role)
    set((state) => ({
      activeRole: role,
      user: state.user ? { ...state.user, role } : null,
    }))
  },

  toggleActiveRole: () => {
    const nextRole: 'client' | 'freelancer' = get().activeRole === 'client' ? 'freelancer' : 'client'
    get().setActiveRole(nextRole)
  },
}))
