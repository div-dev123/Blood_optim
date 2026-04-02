import type { BloodType, User, UserRole } from '../types'
import { apiDeleteAuth, apiGetAuth, apiPatchAuth, apiPost } from '../utils/apiClient'

export interface AuthResponse {
  token: string
  user: User
}

export async function registerUser(payload: {
  email: string
  password: string
  role: UserRole
  name: string
  phone: string
  bloodType?: BloodType
  hospitalLicense?: string
}): Promise<AuthResponse> {
  return await apiPost<AuthResponse>('/api/v1/auth/register', {
    email: payload.email,
    password: payload.password,
    role: payload.role,
    name: payload.name,
    phone: payload.phone,
    blood_type: payload.bloodType,
    hospital_license: payload.hospitalLicense,
  })
}

export async function loginUser(payload: {
  email: string
  password: string
  role: UserRole
}): Promise<AuthResponse> {
  return await apiPost<AuthResponse>('/api/v1/auth/login', payload)
}

export async function getMe(token: string): Promise<User> {
  return await apiGetAuth<User>('/api/v1/auth/me', token)
}

export async function updateMyProfile(payload: {
  token: string
  displayName?: string
  phone?: string
  notifications?: Record<string, unknown>
  animationSpeed?: 'Normal' | 'Fast' | 'Reduced Motion'
  signal?: AbortSignal
}): Promise<User> {
  return await apiPatchAuth<User>(
    '/api/v1/auth/me',
    {
      display_name: payload.displayName,
      phone: payload.phone,
      notifications: payload.notifications,
      animation_speed: payload.animationSpeed,
    },
    payload.token,
    { signal: payload.signal },
  )
}

export async function exportMyData(payload: {
  token: string
  signal?: AbortSignal
}): Promise<unknown> {
  return await apiGetAuth<unknown>('/api/v1/auth/export', payload.token, { signal: payload.signal })
}

export async function deleteMyAccount(payload: {
  token: string
  signal?: AbortSignal
}): Promise<{ status: string } | void> {
  return await apiDeleteAuth<{ status: string }>('/api/v1/auth/me', payload.token, { signal: payload.signal })
}
