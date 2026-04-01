export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

// ---------------------------------------------------------------------------
// Core domain types
// ---------------------------------------------------------------------------

export interface BloodUnit {
  id: string;
  bloodType: BloodType;
  collectionDate: string;
  expiryDate: string;
  status: 'available' | 'reserved' | 'expired' | 'dispatched';
  location: string;
  matchScore?: number;
  donor?: {
    id: string;
    name: string;
  };
}

export interface Prediction {
  date: string;
  bloodType: BloodType;
  predictedDemand: number;
  currentInventory: number;
  confidence: number;
  shortage: boolean;
}

export interface Donor {
  id: string;
  name: string;
  email: string;
  bloodType: BloodType;
  creditScore: number;
  totalDonations: number;
  lastDonationDate?: string;
  nextEligibleDate?: string;
}

export interface Redistribution {
  id: string;
  fromLocation: string;
  toLocation: string;
  bloodTypes: BloodType[];
  units: number;
  status: 'requested' | 'approved' | 'in-transit' | 'delivered';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  eta?: string;
}

export interface MatchScore {
  unitId: string;
  overallScore: number;
  freshnessScore: number;
  antigenScore: number;
  proximityScore: number;
  rank: number;
}

// ---------------------------------------------------------------------------
// Auth & profile types (role-based access)
// ---------------------------------------------------------------------------

export type UserRole = 'HOSPITAL' | 'DONOR';

export interface HospitalProfile {
  hospitalName: string;
  hospitalId: string;
  location: {
    address: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };
  license: string;
  contactPerson: string;
  phone: string;
  bloodBankCapacity: number;
  currentInventory: {
    totalUnits: number;
    byType: Partial<Record<BloodType, number>>;
  };
  tier: 'basic' | 'premium' | 'enterprise';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export interface DonorProfile {
  firstName: string;
  lastName: string;
  bloodType: BloodType;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  creditScore: number;
  totalDonations: number;
  lastDonationDate: string | null;
  eligibleDate: string;
  healthStatus: 'eligible' | 'temporary_deferral' | 'permanent_deferral';
  preferredDonationCenter: string;
  achievements: Achievement[];
  level: number;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile: HospitalProfile | DonorProfile;
  isAuthenticated: boolean;
  avatarUrl?: string;
}

export interface Notification {
  id: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

