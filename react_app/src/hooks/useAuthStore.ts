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
  signIn: (
    email: string,
    password: string,
    expectedRole?: 'client' | 'freelancer'
  ) => Promise<{ success: boolean; error?: string }>
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
  id: '1e0dacbd-8d91-46f2-b04e-02acad08ce0c',
  email: 'client.demo@trustbroker.ai',
  name: 'Elena Rostova (Client)',
  role: 'client',
  organization: 'Acme Global Ventures LLC',
}

const DEV_FREELANCER_USER: UserProfile = {
  id: '2203012f-e6ac-4efb-8d63-4dc4e1a4bbbc',
  email: 'freelancer.demo@trustbroker.ai',
  name: 'Tariro Moyo (Freelancer)',
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
    const storedRole = (localStorage.getItem('tb_active_role') as 'client' | 'freelancer') || 'client'

    // Always register the auth state change listener when Supabase is configured,
    // regardless of whether a session exists yet. This ensures sign-in/sign-out
    // events are captured even when the user arrives unauthenticated.
    if (isSupabaseConfigured) {
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session && session.user) {
          const role = get().activeRole
          const profile = mapSupabaseUser(session.user, role)
          localStorage.removeItem('tb_dev_token')
          set({
            session,
            user: profile,
            devToken: null,
            activeRole: profile.role === 'freelancer' ? 'freelancer' : role,
            isAuthenticated: true,
            isLoading: false,
            initialized: true,
          })
        } else if (event === 'TOKEN_REFRESHED' && session && session.user) {
          const role = get().activeRole
          const profile = mapSupabaseUser(session.user, role)
          set({
            session,
            user: profile,
            isAuthenticated: true,
            isLoading: false,
          })
        } else if (event === 'SIGNED_OUT') {
          if (!get().devToken) {
            set({
              session: null,
              user: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        }
      })

      // Check for existing session
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!error && session && session.user) {
          localStorage.removeItem('tb_dev_token')
          const profile = mapSupabaseUser(session.user, storedRole)
          set({
            session,
            user: profile,
            devToken: null,
            activeRole: profile.role === 'freelancer' ? 'freelancer' : storedRole,
            isAuthenticated: true,
            isLoading: false,
            initialized: true,
          })
          return
        }
      } catch (err) {
        console.warn('Supabase auth getSession warning, checking local dev session:', err)
      }
    }

    // 2. Check for stored Dev Session if no active Supabase session
    const storedDevToken = localStorage.getItem('tb_dev_token')
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

    set({
      session: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      initialized: true,
    })
  },

  signIn: async (email: string, password: string, expectedRole?: 'client' | 'freelancer') => {
    set({ isLoading: true })

    const DEMO_PASSWORD = 'DemoPassword2026!'
    const isClientDemo = (
      (email === 'client.demo@trustbroker.ai' || email === 'elena@acmeglobal.com') &&
      (password === DEMO_PASSWORD || password === 'password123' || password === 'demo123')
    )
    const isFreelancerDemo = (
      (email === 'freelancer.demo@trustbroker.ai' || email === 'tariro@devstudio.co.zw') &&
      (password === DEMO_PASSWORD || password === 'password123' || password === 'demo123')
    )

    // Role sensitivity check for demo credentials
    if (expectedRole === 'client' && isFreelancerDemo) {
      set({ isLoading: false })
      return {
        success: false,
        error: 'This account is registered as a Freelancer account. Please select Freelancer workspace to sign in.',
      }
    }
    if (expectedRole === 'freelancer' && isClientDemo) {
      set({ isLoading: false })
      return {
        success: false,
        error: 'This account is registered as a Client account. Please select Client workspace to sign in.',
      }
    }

    // 1. Try real Supabase Auth first when configured
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (!error && data.session && data.user) {
          const profile = mapSupabaseUser(data.user)

          // Role enforcement: if expectedRole is provided, validate against registered role
          if (expectedRole && profile.role !== expectedRole) {
            await supabase.auth.signOut()
            set({
              session: null,
              user: null,
              isAuthenticated: false,
              isLoading: false,
            })
            const regLabel = profile.role === 'freelancer' ? 'Freelancer' : 'Client'
            return {
              success: false,
              error: `This account is registered as a ${regLabel} account. Please use the ${regLabel} sign-in option.`,
            }
          }

          localStorage.removeItem('tb_dev_token')
          localStorage.setItem('tb_active_role', profile.role)
          set({
            session: data.session,
            user: profile,
            devToken: null,
            activeRole: profile.role === 'freelancer' ? 'freelancer' : 'client',
            isAuthenticated: true,
            isLoading: false,
            initialized: true,
          })
          return { success: true }
        }

        if (error) {
          // If Supabase returns error for demo accounts, fall back to dev role seamlessly (respecting expectedRole)
          if (isClientDemo && (!expectedRole || expectedRole === 'client')) {
            console.info('Supabase sign-in fallback to client demo account:', error.message)
            get().signInWithDevRole('client')
            set({ isLoading: false })
            return { success: true }
          }
          if (isFreelancerDemo && (!expectedRole || expectedRole === 'freelancer')) {
            console.info('Supabase sign-in fallback to freelancer demo account:', error.message)
            get().signInWithDevRole('freelancer')
            set({ isLoading: false })
            return { success: true }
          }

          set({ isLoading: false })
          const isInvalid = error.message.toLowerCase().includes('invalid login credentials') || error.status === 400
          const friendlyMessage = isInvalid
            ? `No ${expectedRole ? (expectedRole === 'client' ? 'Client' : 'Freelancer') : ''} account found with these credentials. Please check your email and password, or create an account.`
            : error.message
          return { success: false, error: friendlyMessage }
        }
      } catch (err: any) {
        if (isClientDemo && (!expectedRole || expectedRole === 'client')) {
          get().signInWithDevRole('client')
          set({ isLoading: false })
          return { success: true }
        }
        if (isFreelancerDemo && (!expectedRole || expectedRole === 'freelancer')) {
          get().signInWithDevRole('freelancer')
          set({ isLoading: false })
          return { success: true }
        }
        set({ isLoading: false })
        return { success: false, error: err?.message || 'Authentication error occurred.' }
      }
    }

    // 2. Local fallback if Supabase not configured
    if (isClientDemo && (!expectedRole || expectedRole === 'client')) {
      get().signInWithDevRole('client')
      set({ isLoading: false })
      return { success: true }
    }
    if (isFreelancerDemo && (!expectedRole || expectedRole === 'freelancer')) {
      get().signInWithDevRole('freelancer')
      set({ isLoading: false })
      return { success: true }
    }

    set({ isLoading: false })
    return {
      success: false,
      error: `No ${expectedRole ? (expectedRole === 'client' ? 'Client' : 'Freelancer') : ''} account found with these credentials.`,
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
