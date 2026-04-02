import type { BloodType, BloodUnit } from '../types'
import { apiGetAuth, apiPostAuth } from '../utils/apiClient'

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
