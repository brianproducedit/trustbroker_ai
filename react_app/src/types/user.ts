export type UserRole = 'client' | 'freelancer' | 'admin'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  organization?: string
  avatarUrl?: string
  createdAt?: string
}

export interface AuthState {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}
