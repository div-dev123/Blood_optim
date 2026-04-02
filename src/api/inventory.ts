import type { BloodType, BloodUnit } from '../types'
import { apiDeleteAuth, apiGetAuth, apiPatchAuth, apiPostAuth } from '../utils/apiClient'

export async function listInventoryUnits(payload: {
  hospitalId: string
  token: string
  signal?: AbortSignal
}): Promise<BloodUnit[]> {
  const query = new URLSearchParams({ hospital_id: payload.hospitalId })
  return await apiGetAuth<BloodUnit[]>(`/api/v1/inventory/units?${query.toString()}`, payload.token, {
    signal: payload.signal,
  })
}

export async function createInventoryUnit(payload: {
  token: string
  hospitalId: string
  bloodType: BloodType
  collectionDate: string
  expiryDate: string
  location: string
  signal?: AbortSignal
}): Promise<BloodUnit> {
  return await apiPostAuth<BloodUnit>(
    '/api/v1/inventory/units',
    {
      hospital_id: payload.hospitalId,
      blood_type: payload.bloodType,
      collection_date: payload.collectionDate,
      expiry_date: payload.expiryDate,
      location: payload.location,
    },
    payload.token,
    { signal: payload.signal },
  )
}

export async function updateInventoryUnit(payload: {
  token: string
  unitId: string
  status?: 'available' | 'reserved' | 'expired' | 'dispatched'
  location?: string
  expiryDate?: string
  signal?: AbortSignal
}): Promise<BloodUnit> {
  return await apiPatchAuth<BloodUnit>(
    `/api/v1/inventory/units/${encodeURIComponent(payload.unitId)}`,
    {
      status: payload.status,
      location: payload.location,
      expiry_date: payload.expiryDate,
    },
    payload.token,
    { signal: payload.signal },
  )
}

export async function deleteInventoryUnit(payload: {
  token: string
  unitId: string
  signal?: AbortSignal
}): Promise<{ status: string } | void> {
  return await apiDeleteAuth<{ status: string }>(
    `/api/v1/inventory/units/${encodeURIComponent(payload.unitId)}`,
    payload.token,
    { signal: payload.signal },
  )
}
