import { format, formatDistanceToNow, isPast } from 'date-fns'

export const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'MMM dd, yyyy')
}

export const formatDateTime = (date: string | Date): string => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm')
}

export const getRelativeTime = (date: string | Date): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export const isExpiringSoon = (expiryDate: string, days: number = 7): boolean => {
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= days && diffDays > 0
}

export const isExpired = (expiryDate: string): boolean => {
  return isPast(new Date(expiryDate))
}
