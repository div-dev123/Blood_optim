import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, MapPin, Award, Calendar, TrendingUp, Gift, Target, BadgeCheck, User } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { BloodType } from '../../types'
import { getBloodTypeColor } from '../../utils/bloodTypeUtils'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'

type DonationRecord = {
  id: string
  date: string // YYYY-MM-DD
  location: string
  units: number
  source: 'camp' | 'manual'
  campId?: string
  emergency?: boolean
  createdAt: string
}

const DONATIONS_KEY = 'donor.donations.v1'
const DONOR_EXTRAS_KEY_PREFIX = 'donor.extras.v1:'

type DonorExtras = {
  dateOfBirth: string | null
  weightKg: number | null
  lastDonationDate: string | null
  updatedAt: string
}

const nearbyOpportunities = [
  { name: 'Blood Bank Central', distance: '2.3 km', need: 'Critical', bloodTypes: ['O+', 'A+'], impact: 95 },
  { name: 'Emergency Center', distance: '5.1 km', need: 'High', bloodTypes: ['B+'], impact: 88 },
  { name: 'Regional Hospital', distance: '8.7 km', need: 'Medium', bloodTypes: ['O-'], impact: 75 },
]

type BloodCamp = {
  id: string
  name: string
  date: string // YYYY-MM-DD
  time: string
  address: string
  city: string
  neededBloodTypes: BloodType[]
  organizer: string
}

const upcomingCamps: BloodCamp[] = [
  {
    id: 'camp-001',
    name: 'City Community Blood Camp',
    date: '2026-03-08',
    time: '10:00 – 16:00',
    address: 'Community Hall, 12 Park Street',
    city: 'Downtown',
    neededBloodTypes: ['O+', 'A+', 'B+'],
    organizer: 'Red Cross Partner',
  },
  {
    id: 'camp-002',
    name: 'University Campus Drive',
    date: '2026-03-15',
    time: '09:00 – 14:00',
    address: 'Main Quad, North Gate',
    city: 'University District',
    neededBloodTypes: ['O-', 'A-', 'AB-'],
    organizer: 'Campus Health Services',
  },
  {
    id: 'camp-003',
    name: 'Corporate Wellness Donation',
    date: '2026-03-22',
    time: '11:00 – 17:00',
    address: 'Tower B Lobby, Tech Park',
    city: 'Tech Park',
    neededBloodTypes: ['AB+', 'B-', 'O+'],
    organizer: 'City Blood Network',
  },
]

function parseDonationRecords(raw: unknown): DonationRecord[] {
  if (!Array.isArray(raw)) return []
  const out: DonationRecord[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const v = item as Partial<DonationRecord>
    if (typeof v.id !== 'string') continue
    if (typeof v.date !== 'string') continue
    if (typeof v.location !== 'string') continue
    if (typeof v.units !== 'number') continue
    if (v.source !== 'camp' && v.source !== 'manual') continue
    if (typeof v.createdAt !== 'string') continue
    out.push({
      id: v.id,
      date: v.date,
      location: v.location,
      units: v.units,
      source: v.source,
      campId: typeof v.campId === 'string' ? v.campId : undefined,
      emergency: typeof v.emergency === 'boolean' ? v.emergency : undefined,
      createdAt: v.createdAt,
    })
  }
  return out
}

function parseDonorExtras(raw: unknown): DonorExtras | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Partial<DonorExtras>
  const dateOfBirth = typeof v.dateOfBirth === 'string' ? v.dateOfBirth : null
  const weightKg = typeof v.weightKg === 'number' && Number.isFinite(v.weightKg) ? v.weightKg : null
  const lastDonationDate = typeof v.lastDonationDate === 'string' ? v.lastDonationDate : null
  const updatedAt = typeof v.updatedAt === 'string' ? v.updatedAt : new Date().toISOString()
  return { dateOfBirth, weightKg, lastDonationDate, updatedAt }
}

function loadDonorExtras(userId: string): DonorExtras | null {
  try {
    const raw = localStorage.getItem(`${DONOR_EXTRAS_KEY_PREFIX}${userId}`)
    if (!raw) return null
    return parseDonorExtras(JSON.parse(raw))
  } catch {
    return null
  }
}

function saveDonorExtras(userId: string, extras: DonorExtras) {
  try {
    localStorage.setItem(`${DONOR_EXTRAS_KEY_PREFIX}${userId}`, JSON.stringify(extras))
  } catch {
    // ignore
  }
}

function loadDonations(): DonationRecord[] {
  try {
    const raw = localStorage.getItem(DONATIONS_KEY)
    if (!raw) return []
    return parseDonationRecords(JSON.parse(raw))
  } catch {
    return []
  }
}

function saveDonations(donations: DonationRecord[]) {
  try {
    localStorage.setItem(DONATIONS_KEY, JSON.stringify(donations))
  } catch {
    // ignore
  }
}

function addDays(dateIso: string, days: number): string {
  const d = new Date(dateIso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function daysBetween(startIso: string, endIso: string): number {
  const a = new Date(startIso)
  const b = new Date(endIso)
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function DonorHome() {
  const { user } = useAuth()

  const [donations, setDonations] = useState<DonationRecord[]>(() => loadDonations())
  const [manualDate, setManualDate] = useState(() => todayIso())
  const [manualLocation, setManualLocation] = useState('')
  const [manualUnits, setManualUnits] = useState(1)
  const [manualEmergency, setManualEmergency] = useState(false)

  const [extras, setExtras] = useState<DonorExtras | null>(null)
  const [extrasDraft, setExtrasDraft] = useState<DonorExtras | null>(null)

  const [registeredCampIds, setRegisteredCampIds] = useState<string[]>([])

  useEffect(() => {
    const userId = user?.id
    if (!userId) return
    const loaded = loadDonorExtras(userId)
    setExtras(loaded)
    setExtrasDraft(loaded)
  }, [user?.id])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('donor.registeredCamps')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) setRegisteredCampIds(parsed.filter((v) => typeof v === 'string'))
    } catch {
      // ignore
    }
  }, [])

  const registeredSet = useMemo(() => new Set(registeredCampIds), [registeredCampIds])

  const donationByCampId = useMemo(() => {
    const map = new Map<string, DonationRecord>()
    for (const d of donations) {
      if (d.campId) map.set(d.campId, d)
    }
    return map
  }, [donations])

  const sortedDonations = useMemo(() => {
    return [...donations].sort((a, b) => b.date.localeCompare(a.date))
  }, [donations])

  const totalDonations = useMemo(() => sortedDonations.length, [sortedDonations.length])
  const totalUnits = useMemo(() => sortedDonations.reduce((sum, d) => sum + d.units, 0), [sortedDonations])
  const livesTouched = useMemo(() => totalUnits * 3, [totalUnits])

  const lastDonationDate = useMemo(() => {
    return sortedDonations[0]?.date ?? extras?.lastDonationDate ?? null
  }, [extras?.lastDonationDate, sortedDonations])
  const nextEligible = useMemo(() => {
    if (!lastDonationDate) return null
    // Typical whole blood donation interval: 90 days
    return addDays(lastDonationDate, 90)
  }, [lastDonationDate])

  const eligibility = useMemo(() => {
    const dob = extras?.dateOfBirth
    const weight = extras?.weightKg ?? null

    const age = (() => {
      if (!dob) return null
      const d = new Date(dob)
      if (Number.isNaN(d.getTime())) return null
      const now = new Date()
      let years = now.getFullYear() - d.getFullYear()
      const m = now.getMonth() - d.getMonth()
      if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years -= 1
      return years
    })()

    const meetsAge = age !== null ? age >= 18 && age <= 65 : null
    const meetsWeight = weight !== null ? weight >= 50 : null

    const eligibleNow = (() => {
      if (meetsAge === false || meetsWeight === false) return false
      if (!nextEligible) return true
      return todayIso() >= nextEligible
    })()

    return { age, meetsAge, weightKg: weight, meetsWeight, eligibleNow }
  }, [extras?.dateOfBirth, extras?.weightKg, nextEligible])

  const creditScore = useMemo(() => {
    const base = 700
    const donationBoost = Math.min(150, totalDonations * 18)
    const recencyBoost = lastDonationDate ? Math.max(0, 40 - Math.min(40, daysBetween(lastDonationDate, todayIso()))) : 0
    return Math.min(900, Math.round(base + donationBoost + recencyBoost))
  }, [lastDonationDate, totalDonations])

  const donorBloodType = useMemo(() => {
    const profile = user?.profile as { bloodType?: BloodType } | undefined
    return profile?.bloodType
  }, [user?.profile])

  const credits = useMemo(() => {
    const base = totalDonations * 100
    const rareBonus = donorBloodType && ['O-', 'AB-'].includes(donorBloodType) ? totalDonations * 50 : 0
    const emergencyCount = donations.filter((d) => d.emergency).length
    const emergencyBonus = emergencyCount * 200
    return base + rareBonus + emergencyBonus
  }, [donations, donorBloodType, totalDonations])

  const achievements = useMemo(() => {
    const first = sortedDonations[sortedDonations.length - 1]?.date
    const third = totalDonations >= 3 ? sortedDonations[sortedDonations.length - 3]?.date : undefined
    const tenth = totalDonations >= 10 ? sortedDonations[sortedDonations.length - 10]?.date : undefined
    const twentyFifth = totalDonations >= 25 ? sortedDonations[sortedDonations.length - 25]?.date : undefined
    const fiftieth = totalDonations >= 50 ? sortedDonations[sortedDonations.length - 50]?.date : undefined

    const rareBlood = donorBloodType && ['O-', 'AB-'].includes(donorBloodType)
    const emergency = donations.some((d) => d.emergency)
    const perfectHealth = eligibility.meetsAge !== false && eligibility.meetsWeight !== false

    return [
      { name: 'First-time Donor', icon: Heart, unlocked: Boolean(first), date: first },
      { name: 'Regular Donor', icon: Award, unlocked: totalDonations >= 3, date: third },
      { name: 'Life Saver', icon: Target, unlocked: totalDonations >= 10, date: tenth },
      { name: 'Hero', icon: Gift, unlocked: totalDonations >= 25, date: twentyFifth },
      { name: 'Legend', icon: TrendingUp, unlocked: totalDonations >= 50, date: fiftieth },
      { name: 'Rare Blood Hero', icon: BadgeCheck, unlocked: Boolean(rareBlood), date: rareBlood ? todayIso() : undefined },
      { name: 'Emergency Responder', icon: Calendar, unlocked: emergency, date: emergency ? sortedDonations[0]?.date : undefined },
      { name: 'Perfect Health', icon: BadgeCheck, unlocked: Boolean(perfectHealth), date: perfectHealth ? todayIso() : undefined },
    ]
  }, [donations, donorBloodType, eligibility.meetsAge, eligibility.meetsWeight, sortedDonations, totalDonations])

  function toggleRegistration(campId: string) {
    setRegisteredCampIds((prev) => {
      const next = prev.includes(campId) ? prev.filter((id) => id !== campId) : [campId, ...prev]
      try {
        localStorage.setItem('donor.registeredCamps', JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  function addDonation(record: Omit<DonationRecord, 'id' | 'createdAt'>) {
    const next: DonationRecord = {
      ...record,
      id: `don_${Math.random().toString(16).slice(2)}_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setDonations((prev) => {
      const updated = [next, ...prev]
      saveDonations(updated)
      return updated
    })
  }

  function removeDonation(id: string) {
    setDonations((prev) => {
      const updated = prev.filter((d) => d.id !== id)
      saveDonations(updated)
      return updated
    })
  }

  function downloadCertificate(d: DonationRecord) {
    const donorName = (() => {
      const profile = user?.profile as { firstName?: string; lastName?: string; hospitalName?: string } | undefined
      if (!profile) return 'Donor'
      const full = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim()
      return full || profile.hospitalName || 'Donor'
    })()

    const text = [
      'Blood Donation Certificate',
      '',
      `Donor: ${donorName}`,
      `Date: ${d.date}`,
      `Location: ${d.location}`,
      `Units: ${d.units}`,
      `Reference: ${d.id}`,
    ].join('\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `donation_certificate_${d.date}_${d.id.slice(0, 8)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadDonorIdCard() {
    if (!user) return
    const profile = user.profile as { firstName?: string; lastName?: string; bloodType?: string; email?: string; phone?: string } | undefined
    const donorName = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim() || user.email
    const bloodType = profile?.bloodType ?? '—'

    const text = [
      'Donor ID Card',
      '',
      `Donor: ${donorName}`,
      `Donor ID: ${user.id}`,
      `Blood Group: ${bloodType}`,
      `Email: ${user.email}`,
      `Phone: ${profile?.phone ?? '—'}`,
      `Date of Birth: ${extras?.dateOfBirth ?? '—'}`,
      `Weight: ${extras?.weightKg ?? '—'}${extras?.weightKg ? ' kg' : ''}`,
      `Last Donation: ${lastDonationDate ?? '—'}`,
      `Next Eligible: ${nextEligible ?? '—'}`,
    ].join('\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `donor_id_${user.id.slice(0, 8)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-clinical-white">
      <Navbar />
      <div className="p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold text-medical-navy mb-2">
              Welcome Back, Donor!
            </h1>
            <p className="text-gray-600">Your impact matters. Every donation saves lives.</p>
          </div>

          {/* Credit Score Display */}
          <Card className="mb-8 bg-gradient-to-r from-medical-navy to-blue-900 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 mb-2">Donor Credit Score</p>
                <div className="text-6xl font-display font-bold mb-2">{creditScore}</div>
                <p className="text-gray-300">Excellent • Top 5% of donors</p>
              </div>
              <div className="text-right">
                <div className="text-3xl mb-2">🏆</div>
                <p className="text-sm text-gray-300">Level {Math.max(1, Math.min(10, Math.floor(totalDonations / 2) + 1))} Donor</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white border-opacity-20">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{totalDonations}</div>
                  <div className="text-sm text-gray-300">Total Donations</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{livesTouched}</div>
                  <div className="text-sm text-gray-300">Lives Touched</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{credits}</div>
                  <div className="text-sm text-gray-300">Credits</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {nextEligible ? `${Math.max(0, daysBetween(todayIso(), nextEligible))}d` : '—'}
                  </div>
                  <div className="text-sm text-gray-300">Next Eligible</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { icon: Heart, label: 'Lives Saved', value: livesTouched, color: 'text-vital-crimson' },
              { icon: TrendingUp, label: 'Impact Score', value: creditScore, color: 'text-ai-cyan' },
              { icon: Award, label: 'Achievements', value: achievements.filter(a => a.unlocked).length, color: 'text-plasma-gold' },
              { icon: Calendar, label: 'Next Donation', value: nextEligible ? nextEligible.split('-')[2] : '—', color: 'text-oxygen-green' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <stat.icon className={`h-8 w-8 ${stat.color} mb-3`} />
                  <div className="text-3xl font-display font-bold text-medical-navy mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Eligibility & ID */}
            <Card>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-heading text-2xl font-semibold text-medical-navy mb-1">
                    Eligibility & ID
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Based on age/weight and your last donation.
                  </p>
                </div>
                <User className="h-6 w-6 text-gray-400" />
              </div>

              <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className={`font-semibold ${eligibility.eligibleNow ? 'text-oxygen-green' : 'text-vital-crimson'}`}>
                      {eligibility.eligibleNow ? 'Eligible to donate' : 'Not eligible yet'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Next eligible</p>
                    <p className="font-semibold text-medical-navy">{nextEligible ?? '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={extrasDraft?.dateOfBirth ?? ''}
                      onChange={(e) => setExtrasDraft((prev) => ({
                        dateOfBirth: e.target.value || null,
                        weightKg: prev?.weightKg ?? extras?.weightKg ?? null,
                        lastDonationDate: prev?.lastDonationDate ?? extras?.lastDonationDate ?? null,
                        updatedAt: new Date().toISOString(),
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={extrasDraft?.weightKg ?? ''}
                      onChange={(e) => {
                        const parsed = Number(e.target.value)
                        setExtrasDraft((prev) => ({
                          dateOfBirth: prev?.dateOfBirth ?? extras?.dateOfBirth ?? null,
                          weightKg: Number.isFinite(parsed) ? parsed : null,
                          lastDonationDate: prev?.lastDonationDate ?? extras?.lastDonationDate ?? null,
                          updatedAt: new Date().toISOString(),
                        }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Last donation (optional)</label>
                    <input
                      type="date"
                      value={extrasDraft?.lastDonationDate ?? ''}
                      onChange={(e) => setExtrasDraft((prev) => ({
                        dateOfBirth: prev?.dateOfBirth ?? extras?.dateOfBirth ?? null,
                        weightKg: prev?.weightKg ?? extras?.weightKg ?? null,
                        lastDonationDate: e.target.value || null,
                        updatedAt: new Date().toISOString(),
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!user?.id || !extrasDraft) return

                      const dob = extrasDraft.dateOfBirth
                      if (dob) {
                        const age = (() => {
                          const d = new Date(dob)
                          if (Number.isNaN(d.getTime())) return null
                          const now = new Date()
                          let years = now.getFullYear() - d.getFullYear()
                          const m = now.getMonth() - d.getMonth()
                          if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years -= 1
                          return years
                        })()
                        if (age !== null && (age < 18 || age > 65)) {
                          toast.error('Age must be between 18 and 65')
                          return
                        }
                      }

                      if (extrasDraft.weightKg !== null && extrasDraft.weightKg < 50) {
                        toast.error('Minimum weight to donate is 50kg')
                        return
                      }

                      if (extrasDraft.lastDonationDate && extrasDraft.lastDonationDate > todayIso()) {
                        toast.error('Last donation date cannot be in the future')
                        return
                      }

                      const next: DonorExtras = {
                        dateOfBirth: extrasDraft.dateOfBirth,
                        weightKg: extrasDraft.weightKg,
                        lastDonationDate: extrasDraft.lastDonationDate,
                        updatedAt: new Date().toISOString(),
                      }
                      saveDonorExtras(user.id, next)
                      setExtras(next)
                      setExtrasDraft(next)
                      toast.success('Eligibility details saved')
                    }}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadDonorIdCard}>
                    Download ID
                  </Button>
                </div>
              </div>
            </Card>

            {/* Nearby Opportunities */}
            <Card>
              <h2 className="font-heading text-2xl font-semibold text-medical-navy mb-4">
                Nearby Donation Opportunities
              </h2>
              <div className="space-y-4">
                {nearbyOpportunities.map((opp, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-medical-navy mb-1">{opp.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {opp.distance} away
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        opp.need === 'Critical' ? 'bg-vital-crimson text-white' :
                        opp.need === 'High' ? 'bg-plasma-gold text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {opp.need} Need
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      {opp.bloodTypes.map(type => (
                        <span
                          key={type}
                          className="px-2 py-1 rounded text-xs text-white font-semibold"
                          style={{ backgroundColor: getBloodTypeColor(type as BloodType) }}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Impact Score</span>
                          <span className="text-sm font-semibold">{opp.impact}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-ai-cyan to-vital-crimson"
                            style={{ width: `${opp.impact}%` }}
                          />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="ml-4"
                        onClick={() => {
                          const el = document.getElementById('donor-upcoming-camps')
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          toast.success('Pick a camp and register a slot')
                        }}
                      >
                        Book Now
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Achievements */}
            <Card>
              <h2 className="font-heading text-2xl font-semibold text-medical-navy mb-4">
                Achievements & Badges
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-2 text-center ${
                      achievement.unlocked
                        ? 'border-plasma-gold bg-plasma-gold bg-opacity-10'
                        : 'border-gray-200 bg-gray-50 opacity-50'
                    }`}
                  >
                    <achievement.icon className={`h-8 w-8 mx-auto mb-2 ${
                      achievement.unlocked ? 'text-plasma-gold' : 'text-gray-400'
                    }`} />
                    <p className="text-sm font-semibold text-medical-navy mb-1">
                      {achievement.name}
                    </p>
                    {achievement.unlocked && achievement.date && (
                      <p className="text-xs text-gray-600">Unlocked {achievement.date}</p>
                    )}
                    {!achievement.unlocked && (
                      <p className="text-xs text-gray-500">Locked</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>

          {/* Upcoming Blood Camps */}
          <div id="donor-upcoming-camps">
            <Card className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-medical-navy">
                  Upcoming Blood Camps
                </h2>
                <p className="text-gray-600 text-sm">Register to reserve a slot.</p>
              </div>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              {upcomingCamps.map((camp, index) => {
                const registered = registeredSet.has(camp.id)
                const donated = donationByCampId.has(camp.id)
                return (
                  <motion.div
                    key={camp.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-medical-navy mb-1">{camp.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {camp.date} • {camp.time} • {camp.city}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <MapPin className="h-4 w-4" />
                          <span>{camp.address}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {camp.neededBloodTypes.map((type) => (
                            <span
                              key={type}
                              className="px-2 py-1 rounded text-xs text-white font-semibold"
                              style={{ backgroundColor: getBloodTypeColor(type) }}
                            >
                              {type}
                            </span>
                          ))}
                          <span className="text-xs text-gray-500">Organized by {camp.organizer}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Button
                          size="sm"
                          variant={registered ? 'outline' : 'primary'}
                          onClick={() => toggleRegistration(camp.id)}
                        >
                          {registered ? 'Registered' : 'Register'}
                        </Button>
                        {registered ? <span className="text-xs text-oxygen-green">Slot reserved</span> : null}

                        {registered ? (
                          <Button
                            size="sm"
                            variant={donated ? 'outline' : 'primary'}
                            onClick={() => {
                              if (donated) {
                                const existing = donationByCampId.get(camp.id)
                                if (existing) {
                                  removeDonation(existing.id)
                                  toast.success('Donation removed')
                                }
                                return
                              }
                              addDonation({
                                date: camp.date,
                                location: camp.name,
                                units: 1,
                                source: 'camp',
                                campId: camp.id,
                              })
                              toast.success('Donation recorded')
                            }}
                          >
                            {donated ? 'Donated' : 'Mark Donated'}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            </Card>
          </div>

          {/* Donation History */}
          <Card>
            <h2 className="font-heading text-2xl font-semibold text-medical-navy mb-4">
              Donation History
            </h2>

            <div className="p-4 border border-gray-200 rounded-lg mb-4">
              <p className="font-semibold text-medical-navy mb-3">Log a Donation</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    placeholder="e.g. City Blood Bank"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
                  <input
                    type="number"
                    min={1}
                    max={3}
                    value={manualUnits}
                    onChange={(e) => setManualUnits(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 mb-2">
                  <input
                    type="checkbox"
                    checked={manualEmergency}
                    onChange={(e) => setManualEmergency(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Emergency request fulfilled
                </label>
                <Button
                  size="sm"
                  onClick={() => {
                    const date = manualDate.trim()
                    const location = manualLocation.trim()
                    const units = Number.isFinite(manualUnits) ? manualUnits : 1

                    if (!date) {
                      toast.error('Please choose a date')
                      return
                    }
                    if (!location) {
                      toast.error('Please enter a location')
                      return
                    }
                    if (!units || units < 1) {
                      toast.error('Units must be at least 1')
                      return
                    }

                    addDonation({
                      date,
                      location,
                      units,
                      source: 'manual',
                      emergency: manualEmergency,
                    })
                    setManualLocation('')
                    setManualUnits(1)
                    setManualEmergency(false)
                    toast.success('Donation logged')
                  }}
                >
                  Add Donation
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {sortedDonations.length === 0 ? (
                <div className="p-4 border border-gray-200 rounded-lg text-sm text-gray-600">
                  No donations logged yet. Use “Log a Donation” above or “Mark Donated” on a registered camp.
                </div>
              ) : null}

              {sortedDonations.map((donation) => (
                <motion.div
                  key={donation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 }}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="h-12 w-12 rounded-full bg-vital-crimson bg-opacity-10 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-vital-crimson" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-medical-navy">{donation.location}</p>
                    <p className="text-sm text-gray-600">{donation.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-medical-navy">{donation.units} unit{donation.units === 1 ? '' : 's'}</p>
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadCertificate(donation)}
                      >
                        Download Certificate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          removeDonation(donation.id)
                          toast.success('Donation removed')
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
