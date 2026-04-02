import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Navbar from '../../components/common/Navbar'
import Sidebar from '../../components/hospital/Sidebar'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { BloodType } from '../../types'
import { getBloodTypeColor } from '../../utils/bloodTypeUtils'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'

import { useAuth } from '../../hooks/useAuth'
import { ApiError } from '../../utils/apiClient'
import { listInventoryUnits, updateInventoryUnit } from '../../api/inventory'
import { addActivity } from '../../utils/activityLog'

type MatchRow = {
  unitId: string
  bloodType: BloodType
  overallScore: number
  freshnessScore: number
  antigenScore: number
  proximityScore: number
  rank: number
  location: string
  expiryDate: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function daysUntil(dateIso: string): number {
  const d = new Date(dateIso)
  const today = new Date()
  const diff = d.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const RECIPIENT_TO_ALLOWED_DONORS: Record<BloodType, BloodType[]> = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
}

function isCompatible(donor: BloodType, recipient: BloodType): boolean {
  return RECIPIENT_TO_ALLOWED_DONORS[recipient].includes(donor)
}

function antigenScore(donor: BloodType, recipient: BloodType): number {
  if (donor === recipient) return 100
  const sameAbo = donor.replace(/[+-]/, '') === recipient.replace(/[+-]/, '')
  const rhOk = recipient.endsWith('+') ? true : donor.endsWith('-')
  if (sameAbo && rhOk) return 92
  if (isCompatible(donor, recipient)) return 85
  return 0
}

export default function MatchScore() {
  const { user, token } = useAuth()

  const hospitalId = useMemo(() => {
    if (
      user?.role === 'HOSPITAL' &&
      user.profile &&
      typeof (user.profile as { hospitalId?: unknown }).hospitalId === 'string'
    ) {
      return (user.profile as { hospitalId: string }).hospitalId
    }
    return 'H001'
  }, [user])

  const [patientBloodType, setPatientBloodType] = useState<BloodType>('O+')
  const [selectedMatch, setSelectedMatch] = useState<number>(0)
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = matches[selectedMatch]

  const radarData = [
    { subject: 'Freshness', A: selected?.freshnessScore || 0, fullMark: 100 },
    { subject: 'Antigens', A: selected?.antigenScore || 0, fullMark: 100 },
    { subject: 'Proximity', A: selected?.proximityScore || 0, fullMark: 100 },
    { subject: 'Overall', A: selected?.overallScore || 0, fullMark: 100 },
  ]

  const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

  return (
    <div className="min-h-screen bg-clinical-white">
      <Navbar />
      <Sidebar />
      <div className="ml-64 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold text-medical-navy mb-2">
              Smart Match Score Viewer
            </h1>
            <p className="text-gray-600">AI-powered compatibility scoring for optimal blood matches</p>
          </div>

          {/* Patient Input Panel */}
          <Card className="mb-8">
            <h2 className="font-heading text-2xl font-semibold text-medical-navy mb-6">
              Patient Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Blood Type
                </label>
                <select
                  value={patientBloodType}
                  onChange={(e) => setPatientBloodType(e.target.value as BloodType)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson focus:border-transparent outline-none"
                >
                  {bloodTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson focus:border-transparent outline-none"
                  placeholder="Enter age"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson focus:border-transparent outline-none"
                  placeholder="e.g., Surgery, Emergency"
                />
              </div>
            </div>
            <div className="mt-6">
              <Button
                isLoading={loading}
                onClick={async () => {
                  const authToken = token
                  if (!authToken) {
                    toast.error('Please login again')
                    return
                  }

                  setLoading(true)
                  setError(null)
                  setSelectedMatch(0)
                  try {
                    const units = await listInventoryUnits({ hospitalId, token: authToken })

                    const computed: MatchRow[] = units
                      .filter((u) => u.status === 'available')
                      .filter((u) => daysUntil(u.expiryDate) >= 0)
                      .filter((u) => isCompatible(u.bloodType, patientBloodType))
                      .map((u) => {
                        const daysLeft = daysUntil(u.expiryDate)
                        const freshness = clamp((daysLeft / 42) * 100, 0, 100)
                        const ant = antigenScore(u.bloodType, patientBloodType)
                        const prox = u.location.toLowerCase().includes('main') ? 92 : 80
                        const overall = clamp(Math.round(0.4 * freshness + 0.4 * ant + 0.2 * prox), 0, 100)
                        return {
                          unitId: u.id,
                          bloodType: u.bloodType,
                          overallScore: overall,
                          freshnessScore: Math.round(freshness),
                          antigenScore: Math.round(ant),
                          proximityScore: Math.round(prox),
                          rank: 0,
                          location: u.location,
                          expiryDate: u.expiryDate,
                        }
                      })
                      .sort((a, b) => {
                        if (b.overallScore !== a.overallScore) return b.overallScore - a.overallScore
                        if (b.antigenScore !== a.antigenScore) return b.antigenScore - a.antigenScore
                        return b.freshnessScore - a.freshnessScore
                      })
                      .map((row, idx) => ({ ...row, rank: idx + 1 }))

                    setMatches(computed)
                    if (computed.length === 0) {
                      setError('No compatible available units found in your inventory')
                      addActivity({
                        kind: 'warning',
                        action: 'Match Search',
                        details: `No matches for ${patientBloodType}`,
                      })
                    } else {
                      addActivity({
                        kind: 'info',
                        action: 'Match Search',
                        details: `${computed.length} matches for ${patientBloodType}`,
                      })
                    }
                  } catch (err) {
                    const message = err instanceof ApiError ? err.message : 'Failed to load inventory matches'
                    setError(message)
                  } finally {
                    setLoading(false)
                  }
                }}
              >
                Find Matches
              </Button>
            </div>
          </Card>

          {/* Match Results */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Match Cards */}
            <div className="lg:col-span-2 space-y-4">
              {error ? (
                <Card className="border border-gray-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-medical-navy">Match note:</span> {error}
                  </p>
                </Card>
              ) : null}

              {matches.map((match, index) => (
                <motion.div
                  key={match.unitId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    hover
                    onClick={() => setSelectedMatch(index)}
                    className={`cursor-pointer border-2 ${
                      index === selectedMatch ? 'border-vital-crimson' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {index === 0 && (
                            <div className="px-3 py-1 bg-plasma-gold text-white rounded-full text-sm font-bold">
                              Best Match
                            </div>
                          )}
                          <span className="px-3 py-1 bg-gray-200 rounded-full text-sm font-semibold">
                            Rank #{match.rank}
                          </span>
                          <span
                            className="px-3 py-1 rounded-full text-white text-sm font-semibold"
                            style={{ backgroundColor: getBloodTypeColor(match.bloodType) }}
                          >
                            {match.bloodType}
                          </span>
                        </div>
                        <p className="font-mono text-sm text-gray-600 mb-2">{match.unitId}</p>
                        <p className="text-gray-600 mb-4">{match.location}</p>
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Freshness</p>
                            <p className="font-semibold">{match.freshnessScore}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Antigens</p>
                            <p className="font-semibold">{match.antigenScore}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Proximity</p>
                            <p className="font-semibold">{match.proximityScore}%</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-display font-bold text-medical-navy mb-2">
                          {match.overallScore}
                        </div>
                        <div className="text-sm text-gray-600">Match Score</div>
                        {/* Arc Gauge */}
                        <div className="mt-4 w-24 h-24 relative">
                          <svg className="transform -rotate-90" width="96" height="96">
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              stroke="#e5e7eb"
                              strokeWidth="8"
                              fill="none"
                            />
                            <motion.circle
                              cx="48"
                              cy="48"
                              r="40"
                              stroke="#DC143C"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 40}`}
                              initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                              animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - match.overallScore / 100) }}
                              transition={{ delay: index * 0.2 }}
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Radar Chart */}
            <Card>
              <h3 className="font-heading text-xl font-semibold text-medical-navy mb-4">
                Score Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Match Score"
                    dataKey="A"
                    stroke="#DC143C"
                    fill="#DC143C"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Recommended Match</span>
                </div>
                <p className="text-sm text-green-600">
                  {selected
                    ? `Unit ${selected.unitId} is currently the best match.`
                    : 'Run a match search to see recommendations.'}
                </p>
              </div>
            </Card>
          </div>

          {/* Comparison Table */}
          <Card>
            <h3 className="font-heading text-xl font-semibold text-medical-navy mb-4">
              Detailed Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Unit ID</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Blood Type</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Overall Score</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Freshness</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Antigens</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Proximity</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match) => (
                    <tr
                      key={match.unitId}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-sm">{match.unitId}</td>
                      <td className="py-3 px-4">
                        <span
                          className="px-3 py-1 rounded-full text-white text-sm font-semibold"
                          style={{ backgroundColor: getBloodTypeColor(match.bloodType) }}
                        >
                          {match.bloodType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-ai-cyan to-vital-crimson"
                              style={{ width: `${match.overallScore}%` }}
                            />
                          </div>
                          <span className="font-semibold">{match.overallScore}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{match.freshnessScore}%</td>
                      <td className="py-3 px-4">{match.antigenScore}%</td>
                      <td className="py-3 px-4">{match.proximityScore}%</td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const authToken = token
                            if (!authToken) {
                              toast.error('Please login again')
                              return
                            }

                            try {
                              await updateInventoryUnit({
                                token: authToken,
                                unitId: match.unitId,
                                status: 'reserved',
                              })
                              setMatches((prev) => prev.filter((m) => m.unitId !== match.unitId))
                              setSelectedMatch(0)
                              addActivity({
                                kind: 'success',
                                action: 'Unit Reserved',
                                details: `${match.bloodType} • ${match.unitId}`,
                              })
                              toast.success('Unit reserved')
                            } catch (err) {
                              const message = err instanceof ApiError ? err.message : 'Failed to reserve unit'
                              toast.error(message)
                            }
                          }}
                        >
                          Reserve
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
