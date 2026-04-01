import { createContext, useContext, useEffect, useState } from 'react'
import type { User, UserRole, HospitalProfile, DonorProfile } from '../types'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const AUTH_KEY = 'bloodflow-auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as { user: User; token: string }
        setUser(parsed.user)
        setToken(parsed.token)
      }
    } catch {
      // ignore corrupt storage
    }
  }, [])

  const persist = (nextUser: User | null, nextToken: string | null) => {
    if (nextUser && nextToken) {
      localStorage.setItem(
        AUTH_KEY,
        JSON.stringify({ user: nextUser, token: nextToken }),
      )
    } else {
      localStorage.removeItem(AUTH_KEY)
    }
  }

  const login = (nextUser: User, nextToken: string) => {
    const authedUser: User = { ...nextUser, isAuthenticated: true }
    setUser(authedUser)
    setToken(nextToken)
    persist(authedUser, nextToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    persist(null, null)
  }

  const updateUser = (nextUser: User) => {
    setUser(nextUser)
    if (token) {
      persist(nextUser, token)
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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

// ---------------------------------------------------------------------------
// Mock auth helpers for demo / offline use
// ---------------------------------------------------------------------------

export type { UserRole, HospitalProfile, DonorProfile }

export async function mockLogin(email: string, _password: string) {
  // Very small demo: decide role based on email pattern
  const isHospital = email.toLowerCase().includes('hospital')

  const hospitalProfile: HospitalProfile = {
    hospitalName: 'Central City Hospital',
    hospitalId: 'H001',
    location: {
      address: '123 Medical Ave',
      city: 'Central City',
      coordinates: { lat: 28.61, lng: 77.21 },
    },
    license: 'LIC-CC-2026',
    contactPerson: 'Dr. Maya Rao',
    phone: '+1 (555) 123-4567',
    bloodBankCapacity: 1200,
    currentInventory: {
      totalUnits: 420,
      byType: {},
    },
    tier: 'premium',
  }

  const donorProfile: DonorProfile = {
    firstName: 'Alex',
    lastName: 'Patel',
    bloodType: 'O+',
    dateOfBirth: '1995-04-12',
    phone: '+1 (555) 987-6543',
    email,
    address: '45 Donor Street, Central City',
    emergencyContact: 'Sam Patel (+1 555 222 3333)',
    creditScore: 820,
    totalDonations: 5,
    lastDonationDate: '2026-01-15',
    eligibleDate: '2026-03-15',
    healthStatus: 'eligible',
    preferredDonationCenter: 'Central City Blood Bank',
    achievements: [],
    level: 3,
  }

  const user: User = isHospital
    ? {
        id: 'demo-hospital',
        email,
        role: 'HOSPITAL',
        profile: hospitalProfile,
        isAuthenticated: true,
      }
    : {
        id: 'demo-donor',
        email,
        role: 'DONOR',
        profile: donorProfile,
        isAuthenticated: true,
      }

  const token = 'demo-token-123'

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 700))

  return { user, token }
}

// Predefined demo users for quick login buttons
export const DEMO_HOSPITAL_USER: User = {
  id: 'demo-hospital',
  email: 'admin@hospital.demo',
  role: 'HOSPITAL',
  profile: {
    hospitalName: 'Demo General Hospital',
    hospitalId: 'H002',
    location: {
      address: '1 Demo Way',
      city: 'Metropolis',
      coordinates: { lat: 19.07, lng: 72.87 },
    },
    license: 'LIC-DEMO-2026',
    contactPerson: 'Dr. Arjun Mehta',
    phone: '+1 (555) 000-1111',
    bloodBankCapacity: 1500,
    currentInventory: {
      totalUnits: 560,
      byType: {},
    },
    tier: 'enterprise',
  },
  isAuthenticated: true,
}

export const DEMO_DONOR_USER: User = {
  id: 'demo-donor',
  email: 'donor@demo.com',
  role: 'DONOR',
  profile: {
    firstName: 'Priya',
    lastName: 'Sharma',
    bloodType: 'A+',
    dateOfBirth: '1998-08-21',
    phone: '+1 (555) 444-9999',
    email: 'donor@demo.com',
    address: '22 Hope Lane, Metropolis',
    emergencyContact: 'Rahul Sharma (+1 555 333 8888)',
    creditScore: 840,
    totalDonations: 8,
    lastDonationDate: '2025-12-20',
    eligibleDate: '2026-02-20',
    healthStatus: 'eligible',
    preferredDonationCenter: 'Metropolis City Blood Center',
    achievements: [],
    level: 4,
  },
  isAuthenticated: true,
}

