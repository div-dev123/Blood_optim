import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'
import { AUTH_KEY, AuthContext } from './authContext'

type AuthStorage = 'local' | 'session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [storage, setStorage] = useState<AuthStorage>('local')

  useEffect(() => {
    try {
      const fromLocal = localStorage.getItem(AUTH_KEY)
      const fromSession = sessionStorage.getItem(AUTH_KEY)

      const stored = fromLocal ?? fromSession
      if (!stored) return

      const parsed = JSON.parse(stored) as { user: User; token: string }
      setUser(parsed.user)
      setToken(parsed.token)
      setStorage(fromLocal ? 'local' : 'session')
    } catch {
      // ignore corrupt storage
    }
  }, [])

  const persist = (
    nextUser: User | null,
    nextToken: string | null,
    target: AuthStorage,
  ) => {
    const store = target === 'local' ? localStorage : sessionStorage
    if (nextUser && nextToken) {
      store.setItem(AUTH_KEY, JSON.stringify({ user: nextUser, token: nextToken }))
    } else {
      store.removeItem(AUTH_KEY)
    }
  }

  const login = (
    nextUser: User,
    nextToken: string,
    options?: { remember?: boolean },
  ) => {
    const authedUser: User = { ...nextUser, isAuthenticated: true }

    const remember = options?.remember ?? true
    const targetStorage: AuthStorage = remember ? 'local' : 'session'

    setUser(authedUser)
    setToken(nextToken)
    setStorage(targetStorage)

    localStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem(AUTH_KEY)
    persist(authedUser, nextToken, targetStorage)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setStorage('local')
    localStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem(AUTH_KEY)
  }

  const updateUser = (nextUser: User) => {
    setUser(nextUser)
    if (token) {
      persist(nextUser, token, storage)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user?.isAuthenticated),
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
