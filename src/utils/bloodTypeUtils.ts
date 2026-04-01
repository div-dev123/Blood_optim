import { BloodType } from '../types'

export const bloodTypeColors: Record<BloodType, string> = {
  'O+': '#E63946',
  'A+': '#F77F00',
  'B+': '#06AED5',
  'AB+': '#9D4EDD',
  'O-': '#DC143C',
  'A-': '#FF9500',
  'B-': '#0096C7',
  'AB-': '#7B2CBF',
}

export const getBloodTypeColor = (bloodType: BloodType): string => {
  return bloodTypeColors[bloodType] || '#2B2D42'
}

export const getBloodTypeLabel = (bloodType: BloodType): string => {
  return bloodType
}

export const calculateDaysUntilExpiry = (expiryDate: string): number => {
  const today = new Date()
  const expiry = new Date(expiryDate)
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export const getUrgencyLevel = (daysUntilExpiry: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (daysUntilExpiry < 3) return 'critical'
  if (daysUntilExpiry < 7) return 'high'
  if (daysUntilExpiry < 14) return 'medium'
  return 'low'
}
