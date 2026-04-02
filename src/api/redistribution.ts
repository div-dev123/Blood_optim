import { apiGetAuth, apiPostAuth } from '../utils/apiClient'

export type RedistributionRequest = {
  id: string
  fromLocation: string
  toLocation: string
  bloodTypes: string[]
  units: number
  status: 'requested' | 'approved' | 'in-transit' | 'delivered'
  urgency: 'low' | 'medium' | 'high' | 'critical'
  eta?: string | null
}

export type RedistributionRecommendation = {
  from_hospital_id: string
  to_hospital_id: string
  blood_type: string
  units: number
  reason: string
  eta: string
}

export async function listRedistributionRequests(payload: {
  token: string
  signal?: AbortSignal
}): Promise<RedistributionRequest[]> {
  return await apiGetAuth<RedistributionRequest[]>('/api/v1/redistribution/requests', payload.token, {
    signal: payload.signal,
  })
}

export async function createRedistributionRequest(payload: {
  token: string
  fromHospitalId: string
  toHospitalId: string
  bloodTypes: string[]
  units: number
  urgency: 'low' | 'medium' | 'high' | 'critical'
  signal?: AbortSignal
}): Promise<RedistributionRequest> {
  return await apiPostAuth<RedistributionRequest>(
    '/api/v1/redistribution/requests',
    {
      from_hospital_id: payload.fromHospitalId,
      to_hospital_id: payload.toHospitalId,
      blood_types: payload.bloodTypes,
      units: payload.units,
      urgency: payload.urgency,
    },
    payload.token,
    { signal: payload.signal },
  )
}

export async function advanceRedistributionRequest(payload: {
  token: string
  requestId: string
  signal?: AbortSignal
}): Promise<RedistributionRequest> {
  return await apiPostAuth<RedistributionRequest>(
    `/api/v1/redistribution/requests/${encodeURIComponent(payload.requestId)}/advance`,
    {},
    payload.token,
    { signal: payload.signal },
  )
}

export async function getRedistributionRecommendations(payload: {
  token: string
  bloodType: string
  neededUnits?: number
  signal?: AbortSignal
}): Promise<RedistributionRecommendation[]> {
  const query = new URLSearchParams({
    blood_type: payload.bloodType,
    needed_units: String(payload.neededUnits ?? 10),
  })
  return await apiGetAuth<RedistributionRecommendation[]>(
    `/api/v1/redistribution/recommendations?${query.toString()}`,
    payload.token,
    { signal: payload.signal },
  )
}
