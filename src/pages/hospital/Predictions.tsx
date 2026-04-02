import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, AlertTriangle, Calendar, Settings } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Sidebar from '../../components/hospital/Sidebar'
import Card from '../../components/common/Card'
import { BloodType, BloodUnit, Prediction } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import { getBloodTypeColor } from '../../utils/bloodTypeUtils'
import { formatDate } from '../../utils/dateHelpers'
import mockPredictions from '../../data/mockPredictions.json'
import mockBloodUnits from '../../data/mockBloodUnits.json'
import { ApiError, apiPost } from '../../utils/apiClient'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'

type DemandForecastPoint = {
  date: string
  q10: number | null
  q50: number
  q90: number | null
}

type DemandForecastResponse = {
  model: string
  hospital_id: string
  blood_group: string
  forecast_days: number
  forecast: DemandForecastPoint[]
}

type PatchGRUForecastResponse = {
  model: string
  forecast_days: number
  demand_forecast_14d: number[]
  days_until_expiry_14d: number[]
}

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const DEMAND_BASELINE: Record<BloodType, number> = {
  'A+': 45,
  'A-': 18,
  'B+': 28,
  'B-': 12,
  'AB+': 15,
  'AB-': 10,
  'O+': 52,
  'O-': 22,
}

const BLOOD_TYPE_SORT: Record<BloodType, number> = {
  'A+': 0,
  'A-': 1,
  'B+': 2,
  'B-': 3,
  'AB+': 4,
  'AB-': 5,
  'O+': 6,
  'O-': 7,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildSyntheticHistory(length: number, baseline: number, seed: number): number[] {
  const rand = mulberry32(seed)
  const safeBaseline = Number.isFinite(baseline) && baseline > 0 ? baseline : 10

  const out: number[] = []
  for (let i = 0; i < length; i += 1) {
    // Light weekly seasonality + bounded noise, deterministic per (hospital,bloodType)
    const seasonality = 1 + 0.08 * Math.sin((2 * Math.PI * i) / 7)
    const noise = (rand() - 0.5) * 0.25
    const v = safeBaseline * seasonality * (1 + noise)
    out.push(Math.max(0, Math.round(v)))
  }
  return out
}

function quantileConfidence(point: DemandForecastPoint): number {
  const q50 = point.q50
  const q10 = point.q10 ?? q50
  const q90 = point.q90 ?? q50

  if (!Number.isFinite(q50) || q50 <= 0) return 0.75
  const spread = Math.max(0, q90 - q10)
  const raw = 1 - spread / (Math.abs(q50) * 2)
  return clamp(raw, 0.5, 0.99)
}

export default function Predictions() {
  const { user } = useAuth()

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

  const inventoryByType = useMemo(() => {
    const counts: Record<BloodType, number> = {
      'A+': 0,
      'A-': 0,
      'B+': 0,
      'B-': 0,
      'AB+': 0,
      'AB-': 0,
      'O+': 0,
      'O-': 0,
    }

    for (const unit of mockBloodUnits as BloodUnit[]) {
      if (unit.status !== 'available') continue
      counts[unit.bloodType] += 1
    }

    return counts
  }, [])

  const [predictions, setPredictions] = useState<Prediction[]>(mockPredictions as Prediction[])
  const [selectedBloodType, setSelectedBloodType] = useState<BloodType | 'all'>('all')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')
  const [tftLoading, setTftLoading] = useState(false)
  const [tftError, setTftError] = useState<string | null>(null)
  const [usingMock, setUsingMock] = useState(true)

  const patchgruBloodType: BloodType = selectedBloodType === 'all' ? 'O+' : selectedBloodType
  const [patchgruForecast, setPatchgruForecast] = useState<PatchGRUForecastResponse | null>(null)
  const [patchgruLoading, setPatchgruLoading] = useState(false)
  const [patchgruError, setPatchgruError] = useState<string | null>(null)

  const defaultCustomBloodType: BloodType = selectedBloodType === 'all' ? 'O+' : selectedBloodType
  const [customBloodType, setCustomBloodType] = useState<BloodType>(defaultCustomBloodType)
  const [customForecastDays, setCustomForecastDays] = useState(7)
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [customHistoryText, setCustomHistoryText] = useState(() => {
    const seed = hashString(`${hospitalId}:${defaultCustomBloodType}:custom-seed`)
    const baseline = DEMAND_BASELINE[defaultCustomBloodType]
    return buildSyntheticHistory(30, baseline, seed).join(', ')
  })
  const [customResult, setCustomResult] = useState<DemandForecastResponse | null>(null)
  const [customLoading, setCustomLoading] = useState(false)
  const [customError, setCustomError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedBloodType === 'all') return
    setCustomBloodType(selectedBloodType)
  }, [selectedBloodType])

  useEffect(() => {
    const seed = hashString(`${hospitalId}:${customBloodType}:custom-seed`)
    const baseline = DEMAND_BASELINE[customBloodType]
    setCustomHistoryText(buildSyntheticHistory(30, baseline, seed).join(', '))
    setCustomResult(null)
    setCustomError(null)
  }, [customBloodType, hospitalId])

  useEffect(() => {
    const controller = new AbortController()

    async function loadTftForecasts() {
      setTftLoading(true)
      setTftError(null)
      setUsingMock(false)

      const encoderDays = 30
      const horizonDays = 7

      try {
        const settled = await Promise.allSettled(
          BLOOD_TYPES.map(async (bloodType) => {
            const seed = hashString(`${hospitalId}:${bloodType}`)
            const baseline = DEMAND_BASELINE[bloodType]
            const historical = buildSyntheticHistory(encoderDays, baseline, seed)

            return apiPost<DemandForecastResponse>(
              '/api/v1/forecast/demand',
              {
                hospital_id: hospitalId,
                blood_group: bloodType,
                historical_demand: historical,
                forecast_days: horizonDays,
              },
              { signal: controller.signal },
            )
          }),
        )

        const failedTypes: BloodType[] = []
        const next: Prediction[] = []

        for (let i = 0; i < settled.length; i += 1) {
          const res = settled[i]
          const bloodType = BLOOD_TYPES[i]

          if (res.status === 'rejected') {
            failedTypes.push(bloodType)
            continue
          }

          const payload = res.value
          const currentInventory = inventoryByType[bloodType] ?? 0

          for (const point of payload.forecast) {
            const predictedDemand = Math.max(0, Math.round(point.q50))
            next.push({
              date: point.date,
              bloodType,
              predictedDemand,
              currentInventory,
              confidence: quantileConfidence(point),
              shortage: predictedDemand > currentInventory,
            })
          }
        }

        if (next.length === 0) {
          throw new Error('No forecast data returned')
        }

        next.sort((a, b) => {
          const d = a.date.localeCompare(b.date)
          if (d !== 0) return d
          return BLOOD_TYPE_SORT[a.bloodType] - BLOOD_TYPE_SORT[b.bloodType]
        })

        setPredictions(next)
        setUsingMock(false)

        if (failedTypes.length > 0) {
          setTftError(`Some blood types could not be forecast: ${failedTypes.join(', ')}`)
        }
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return

        const message = err instanceof ApiError ? err.message : 'Failed to load live forecasts'
        setTftError(message)
        setPredictions(mockPredictions as Prediction[])
        setUsingMock(true)
      } finally {
        setTftLoading(false)
      }
    }

    loadTftForecasts()

    return () => controller.abort()
  }, [hospitalId, inventoryByType])

  useEffect(() => {
    const controller = new AbortController()

    async function loadPatchGruForecast() {
      setPatchgruLoading(true)
      setPatchgruError(null)

      const lookbackDays = 28

      try {
        const seed = hashString(`${hospitalId}:${patchgruBloodType}:patchgru`)
        const baseline = DEMAND_BASELINE[patchgruBloodType]
        const historical = buildSyntheticHistory(lookbackDays, baseline, seed)

        const result = await apiPost<PatchGRUForecastResponse>(
          '/api/v1/forecast/expiry',
          {
            hospital_id: hospitalId,
            blood_group: patchgruBloodType,
            historical_demand: historical,
          },
          { signal: controller.signal },
        )

        setPatchgruForecast(result)
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return
        const message = err instanceof ApiError ? err.message : 'Failed to load PatchGRU forecast'
        setPatchgruError(message)
        setPatchgruForecast(null)
      } finally {
        setPatchgruLoading(false)
      }
    }

    loadPatchGruForecast()
    return () => controller.abort()
  }, [hospitalId, patchgruBloodType])

  const filteredPredictions = useMemo(() => {
    return selectedBloodType === 'all'
      ? predictions
      : predictions.filter((p) => p.bloodType === selectedBloodType)
  }, [predictions, selectedBloodType])

  const chartData = useMemo(() => {
    if (selectedBloodType === 'all') {
      const byDate = new Map<string, { date: string; predicted: number; current: number }>()
      for (const p of predictions) {
        const existing = byDate.get(p.date) ?? { date: p.date, predicted: 0, current: 0 }
        existing.predicted += p.predictedDemand
        existing.current += p.currentInventory
        byDate.set(p.date, existing)
      }

      return Array.from(byDate.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((row) => ({
          date: formatDate(row.date).split(',')[0],
          predicted: row.predicted,
          current: row.current,
          shortage: Math.max(0, row.predicted - row.current),
        }))
    }

    return [...filteredPredictions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((p) => ({
        date: formatDate(p.date).split(',')[0],
        predicted: p.predictedDemand,
        current: p.currentInventory,
        shortage: p.shortage ? p.predictedDemand - p.currentInventory : 0,
      }))
  }, [filteredPredictions, predictions, selectedBloodType])

  const patchgruChartData = useMemo(() => {
    if (!patchgruForecast) return []
    const today = new Date()

    return patchgruForecast.days_until_expiry_14d.map((v, idx) => {
      const d = new Date(today)
      d.setDate(today.getDate() + idx + 1)
      const iso = d.toISOString().slice(0, 10)
      return {
        date: formatDate(iso).split(',')[0],
        daysUntilExpiry: Number.isFinite(v) ? v : 0,
      }
    })
  }, [patchgruForecast])

  const customChartData = useMemo(() => {
    if (!customResult) return []
    return customResult.forecast.map((p) => ({
      date: formatDate(p.date).split(',')[0],
      q10: p.q10 ?? p.q50,
      q50: p.q50,
      q90: p.q90 ?? p.q50,
    }))
  }, [customResult])

  return (
    <div className="min-h-screen bg-clinical-white">
      <Navbar />
      <Sidebar />
      <div className="ml-64 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-4xl font-bold text-medical-navy mb-2">
                AI Predictions Dashboard
              </h1>
              <p className="text-gray-600">
                {usingMock
                  ? 'Demo data (start the backend for live forecasts)'
                  : 'Live TFT demand forecast + PatchGRU expiry risk'}
              </p>
            </div>
            <div className="flex gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none"
              >
                <option value="7d">7 Days</option>
                <option value="30d" disabled>
                  30 Days (coming soon)
                </option>
                <option value="90d" disabled>
                  90 Days (coming soon)
                </option>
              </select>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>

          {tftError && (
            <Card className="mb-6 border border-gray-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-medical-navy">Forecast note:</span> {tftError}
                {usingMock ? ' (showing mock data)' : null}
              </p>
            </Card>
          )}

          {/* Model Performance */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Accuracy', value: '87%', trend: '+2.3%', color: 'text-oxygen-green' },
              { label: 'MAE', value: '4.2', trend: '-0.8', color: 'text-oxygen-green' },
              { label: 'RMSE', value: '5.8', trend: '-1.2', color: 'text-oxygen-green' },
              { label: 'Confidence', value: '92%', trend: '+1.5%', color: 'text-ai-cyan' },
            ].map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{metric.label}</span>
                    <TrendingUp className={`h-4 w-4 ${metric.color}`} />
                  </div>
                  <div className="text-3xl font-display font-bold text-medical-navy mb-1">{metric.value}</div>
                  <div className={`text-sm ${metric.color}`}>{metric.trend}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Blood Type Filter */}
          <Card className="mb-6">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedBloodType('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedBloodType === 'all'
                    ? 'bg-vital-crimson text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Types
              </button>
              {BLOOD_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedBloodType(type)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedBloodType === type
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={selectedBloodType === type ? { backgroundColor: getBloodTypeColor(type) } : {}}
                >
                  {type}
                </button>
              ))}
            </div>
          </Card>

          {/* Interactive Demand Forecast */}
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading text-xl font-semibold text-medical-navy">
                  Interactive Demand Forecast
                </h3>
                <p className="text-sm text-gray-600">
                  Enter historical demand values and run a live TFT forecast.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
                  <select
                    value={customBloodType}
                    onChange={(e) => setCustomBloodType(e.target.value as BloodType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none"
                  >
                    {BLOOD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Forecast Days</label>
                    <input
                      type="number"
                      min={1}
                      max={14}
                      value={customForecastDays}
                      onChange={(e) => setCustomForecastDays(clamp(Number(e.target.value || 0), 1, 14))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Historical Demand (comma/newline separated)
                  </label>
                  <textarea
                    value={customHistoryText}
                    onChange={(e) => setCustomHistoryText(e.target.value)}
                    rows={7}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none font-mono text-sm"
                    placeholder="e.g. 12, 14, 11, 13"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Tip: 30 values works well; minimum 1.
                  </p>
                </div>

                {customError ? <p className="text-sm text-vital-crimson">{customError}</p> : null}

                <button
                  className="w-full px-4 py-2 rounded-lg bg-vital-crimson text-white font-semibold hover:opacity-90 disabled:opacity-60"
                  disabled={customLoading}
                  onClick={async () => {
                    const values = customHistoryText
                      .split(/[\s,]+/)
                      .map((v) => v.trim())
                      .filter(Boolean)
                      .map((v) => Number(v))
                      .filter((v) => Number.isFinite(v))

                    if (values.length < 1) {
                      setCustomError('Please enter at least one numeric value')
                      setCustomResult(null)
                      return
                    }

                    setCustomLoading(true)
                    setCustomError(null)
                    setCustomResult(null)

                    try {
                      const res = await apiPost<DemandForecastResponse>('/api/v1/forecast/demand', {
                        hospital_id: hospitalId,
                        blood_group: customBloodType,
                        historical_demand: values,
                        forecast_days: customForecastDays,
                        end_date: customEndDate,
                      })
                      setCustomResult(res)
                    } catch (err) {
                      const message = err instanceof ApiError ? err.message : 'Failed to run forecast'
                      setCustomError(message)
                    } finally {
                      setCustomLoading(false)
                    }
                  }}
                >
                  {customLoading ? 'Predicting…' : 'Predict'}
                </button>
              </div>

              <div className="lg:col-span-2">
                <h4 className="font-heading font-semibold text-medical-navy mb-2">Forecast Output</h4>
                {customResult ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-3">
                      {customResult.model} • {customResult.blood_group} • {customResult.forecast_days} days
                    </p>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={customChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="q50" stroke="#00E5FF" strokeWidth={3} name="q50" />
                        <Line type="monotone" dataKey="q10" stroke="#DC143C" strokeWidth={1} name="q10" dot={false} />
                        <Line type="monotone" dataKey="q90" stroke="#DC143C" strokeWidth={1} name="q90" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Run a forecast to see results here.</p>
                )}
              </div>
            </div>
          </Card>

          {/* Forecast Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <h3 className="font-heading text-xl font-semibold text-medical-navy mb-4">
                Demand Forecast vs Current Inventory
              </h3>
              {tftLoading ? (
                <p className="text-sm text-gray-600">Loading live forecasts…</p>
              ) : null}
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="predicted" stroke="#00E5FF" strokeWidth={3} name="Predicted Demand" />
                  <Line type="monotone" dataKey="current" stroke="#DC143C" strokeWidth={2} name="Current Inventory" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <div className="space-y-6">
              <Card>
                <h3 className="font-heading text-xl font-semibold text-medical-navy mb-4">
                  Shortage Alerts
                </h3>
                <div className="space-y-3">
                  {filteredPredictions
                    .filter(p => p.shortage)
                    .map((prediction, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-vital-crimson" />
                          <span className="font-semibold text-medical-navy">{prediction.bloodType}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{formatDate(prediction.date)}</p>
                        <p className="text-sm">
                          Shortage:{' '}
                          <span className="font-semibold text-vital-crimson">
                            {prediction.predictedDemand - prediction.currentInventory} units
                          </span>
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-vital-crimson"
                              style={{ width: `${(prediction.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">
                            {(prediction.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-xl font-semibold text-medical-navy">
                    Expiry Risk Forecast
                  </h3>
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  PatchGRU • {patchgruBloodType} • next 14 days
                </p>

                {patchgruLoading ? (
                  <p className="text-sm text-gray-600">Loading PatchGRU forecast…</p>
                ) : patchgruError ? (
                  <p className="text-sm text-gray-600">{patchgruError}</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={patchgruChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="daysUntilExpiry" name="Days Until Expiry" fill="#00E5FF">
                        {patchgruChartData.map((entry, idx) => (
                          <Cell
                            key={`${entry.date}-${idx}`}
                            fill={entry.daysUntilExpiry < 7 ? '#DC143C' : '#00E5FF'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>
          </div>

          {/* Predictions Table */}
          <Card>
            <h3 className="font-heading text-xl font-semibold text-medical-navy mb-4">
              Detailed Predictions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Date</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Blood Type</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Predicted Demand</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Current Inventory</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Shortage</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPredictions.map((prediction, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">{formatDate(prediction.date)}</td>
                      <td className="py-3 px-4">
                        <span
                          className="px-3 py-1 rounded-full text-white text-sm font-semibold"
                          style={{ backgroundColor: getBloodTypeColor(prediction.bloodType) }}
                        >
                          {prediction.bloodType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">{prediction.predictedDemand}</td>
                      <td className="py-3 px-4">{prediction.currentInventory}</td>
                      <td className="py-3 px-4">
                        {prediction.shortage ? (
                          <span className="text-vital-crimson font-semibold">
                            {prediction.predictedDemand - prediction.currentInventory} units
                          </span>
                        ) : (
                          <span className="text-oxygen-green">Sufficient</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-ai-cyan"
                              style={{ width: `${prediction.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold">
                            {(prediction.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
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
