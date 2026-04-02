import type { User, UserRole, BloodType } from '../types'
import { apiGetAuth, apiPost } from '../utils/apiClient'

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
