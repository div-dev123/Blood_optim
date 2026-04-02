import { createContext } from 'react'
import type { User } from '../types'

export interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string, options?: { remember?: boolean }) => void
  logout: () => void
  updateUser: (user: User) => void
}

export const AUTH_KEY = 'bloodflow-auth'

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
