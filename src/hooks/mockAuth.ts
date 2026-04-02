import type { DonorProfile, HospitalProfile, User, UserRole } from '../types'

export async function mockLogin(
  email: string,
  _password: string,
  role?: UserRole,
) {
  const resolvedRole: UserRole =
    role ?? (email.toLowerCase().includes('hospital') ? 'HOSPITAL' : 'DONOR')

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

  const user: User =
    resolvedRole === 'HOSPITAL'
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
