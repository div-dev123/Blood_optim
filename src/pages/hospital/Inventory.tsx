import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Download, Plus, QrCode } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Navbar from '../../components/common/Navbar'
import Sidebar from '../../components/hospital/Sidebar'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { BloodUnit, BloodType } from '../../types'
import { getBloodTypeColor, calculateDaysUntilExpiry } from '../../utils/bloodTypeUtils'
import { formatDate } from '../../utils/dateHelpers'
import {
  createInventoryUnit,
  deleteInventoryUnit,
  listInventoryUnits,
  updateInventoryUnit,
} from '../../api/inventory'
import { useAuth } from '../../hooks/useAuth'
import { ApiError } from '../../utils/apiClient'
import { addActivity } from '../../utils/activityLog'

export default function Inventory() {
  const { user, token } = useAuth()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBloodType, setSelectedBloodType] = useState<BloodType | 'all'>('all')
  const [viewMode] = useState<'table' | 'grid'>('table')
  const [units, setUnits] = useState<BloodUnit[]>([])
  const [loading, setLoading] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

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

  const [showAddUnit, setShowAddUnit] = useState(false)
  const [newUnit, setNewUnit] = useState({
    bloodType: 'O+' as BloodType,
    collectionDate: new Date().toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 28).toISOString().slice(0, 10),
    location: 'Main Storage',
    quantity: 1,
  })

  useEffect(() => {
    if (!token) return
    const authToken = token
    const controller = new AbortController()

    async function load(currentToken: string) {
      setLoading(true)
      setLoadError(null)
      try {
        const rows = await listInventoryUnits({
          hospitalId,
          token: currentToken,
          signal: controller.signal,
        })
        setUnits(rows)
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return
        const message = err instanceof ApiError ? err.message : 'Failed to load inventory'
        setLoadError(message)
      } finally {
        setLoading(false)
      }
    }

    load(authToken)
    return () => controller.abort()
  }, [hospitalId, token])

  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBloodType = selectedBloodType === 'all' || unit.bloodType === selectedBloodType
    return matchesSearch && matchesBloodType
  })

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
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-4xl font-bold text-medical-navy">
              Inventory Management
            </h1>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  const payload = {
                    exportedAt: new Date().toISOString(),
                    hospitalId,
                    units: filteredUnits,
                  }
                  const blob = new Blob([JSON.stringify(payload, null, 2)], {
                    type: 'application/json',
                  })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `inventory_${hospitalId}_${new Date().toISOString().slice(0, 10)}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                  addActivity({
                    kind: 'info',
                    action: 'Inventory Exported',
                    details: `${filteredUnits.length} units`,
                  })
                }}
              >
                <Download className="mr-2 inline" />
                Export
              </Button>
              <Button onClick={() => setShowAddUnit((v) => !v)}>
                <Plus className="mr-2 inline" />
                Add Unit
              </Button>
            </div>
          </div>

          {showAddUnit && (
            <Card className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
                  <select
                    value={newUnit.bloodType}
                    onChange={(e) => setNewUnit((s) => ({ ...s, bloodType: e.target.value as BloodType }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none"
                  >
                    {bloodTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Collection Date</label>
                  <input
                    type="date"
                    value={newUnit.collectionDate}
                    onChange={(e) => setNewUnit((s) => ({ ...s, collectionDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="date"
                    value={newUnit.expiryDate}
                    onChange={(e) => setNewUnit((s) => ({ ...s, expiryDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={newUnit.location}
                    onChange={(e) => setNewUnit((s) => ({ ...s, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none"
                    placeholder="Main Storage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newUnit.quantity}
                    onChange={(e) => setNewUnit((s) => ({ ...s, quantity: Math.max(1, Number(e.target.value || 1)) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none"
                  />
                </div>

                <div>
                  <Button
                    className="w-full"
                    isLoading={addLoading}
                    disabled={!token || loading || addLoading}
                    onClick={async () => {
                      const authToken = token
                      if (!authToken) {
                        toast.error('Please login again')
                        return
                      }

                      const qty = Math.max(1, Math.floor(Number(newUnit.quantity || 1)))
                      if (qty > 100) {
                        toast.error('Quantity is too large (max 100)')
                        return
                      }

                      try {
                        setAddLoading(true)

                        const createdUnits: BloodUnit[] = []
                        let lastError: unknown = null
                        for (let i = 0; i < qty; i += 1) {
                          try {
                            // Sequential to avoid hammering SQLite + keep error handling simple.
                            const created = await createInventoryUnit({
                              token: authToken,
                              hospitalId,
                              bloodType: newUnit.bloodType,
                              collectionDate: newUnit.collectionDate,
                              expiryDate: newUnit.expiryDate,
                              location: newUnit.location,
                            })
                            createdUnits.push(created)
                          } catch (e) {
                            lastError = e
                            break
                          }
                        }

                        if (createdUnits.length > 0) {
                          setUnits((prev) => [...createdUnits, ...prev])
                        }

                        if (createdUnits.length === qty) {
                          addActivity({
                            kind: 'success',
                            action: 'Unit Added',
                            details: `${newUnit.bloodType} • ${newUnit.location} • x${qty}`,
                          })
                          toast.success(qty === 1 ? 'Blood unit added' : `Added ${qty} units`)
                          setShowAddUnit(false)
                        } else {
                          addActivity({
                            kind: 'warning',
                            action: 'Unit Added (Partial)',
                            details: `${newUnit.bloodType} • ${newUnit.location} • x${createdUnits.length}/${qty}`,
                          })
                          const msg =
                            lastError instanceof ApiError
                              ? lastError.message
                              : 'Some units failed to add'
                          toast.error(`${msg} (added ${createdUnits.length}/${qty})`)
                        }
                      } catch (err) {
                        const message = err instanceof ApiError ? err.message : 'Failed to add unit'
                        toast.error(message)
                      } finally {
                        setAddLoading(false)
                      }
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Filters */}
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ID or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson focus:border-transparent outline-none"
                />
              </div>
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
                {bloodTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedBloodType(type)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedBloodType === type
                        ? 'bg-vital-crimson text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={selectedBloodType === type ? { backgroundColor: getBloodTypeColor(type) } : {}}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Table View */}
          {viewMode === 'table' && (
            <Card>
              {loadError ? (
                <div className="mb-4 text-sm text-gray-700">
                  <span className="font-semibold text-medical-navy">Inventory note:</span> {loadError}
                </div>
              ) : null}
              {loading ? <p className="text-sm text-gray-600">Loading inventory…</p> : null}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Unit ID</th>
                      <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Blood Type</th>
                      <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Collection Date</th>
                      <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Expiry Date</th>
                      <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Status</th>
                      <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Location</th>
                      <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Match Score</th>
                      <th className="text-left py-3 px-4 font-heading font-semibold text-medical-navy">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnits.map((unit, index) => {
                      const daysUntilExpiry = calculateDaysUntilExpiry(unit.expiryDate)
                      return (
                        <motion.tr
                          key={unit.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono text-sm">{unit.id}</td>
                          <td className="py-3 px-4">
                            <span
                              className="px-3 py-1 rounded-full text-white text-sm font-semibold"
                              style={{ backgroundColor: getBloodTypeColor(unit.bloodType) }}
                            >
                              {unit.bloodType}
                            </span>
                          </td>
                          <td className="py-3 px-4">{formatDate(unit.collectionDate)}</td>
                          <td className="py-3 px-4">
                            <span className={daysUntilExpiry < 7 ? 'text-vital-crimson font-semibold' : ''}>
                              {formatDate(unit.expiryDate)}
                            </span>
                            {daysUntilExpiry < 7 && (
                              <span className="ml-2 text-xs text-gray-500">({daysUntilExpiry}d left)</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              unit.status === 'available' ? 'bg-oxygen-green bg-opacity-20 text-oxygen-green' :
                              unit.status === 'reserved' ? 'bg-plasma-gold bg-opacity-20 text-plasma-gold' :
                              'bg-gray-200 text-gray-600'
                            }`}>
                              {unit.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">{unit.location}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-ai-cyan to-vital-crimson"
                                  style={{ width: `${unit.matchScore || 0}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold">{unit.matchScore || 0}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={unit.status}
                                onChange={async (e) => {
                                  const authToken = token
                                  if (!authToken) {
                                    toast.error('Please login again')
                                    return
                                  }
                                  const nextStatus = e.target.value as
                                    | 'available'
                                    | 'reserved'
                                    | 'expired'
                                    | 'dispatched'

                                  try {
                                    const updated = await updateInventoryUnit({
                                      token: authToken,
                                      unitId: unit.id,
                                      status: nextStatus,
                                    })
                                    setUnits((prev) => prev.map((u) => (u.id === unit.id ? updated : u)))
                                    addActivity({
                                      kind: 'info',
                                      action: 'Status Updated',
                                      details: `${updated.bloodType} → ${updated.status}`,
                                    })
                                    toast.success('Status updated')
                                  } catch (err) {
                                    const message = err instanceof ApiError ? err.message : 'Failed to update status'
                                    toast.error(message)
                                  }
                                }}
                                className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-vital-crimson outline-none"
                              >
                                <option value="available">available</option>
                                <option value="reserved">reserved</option>
                                <option value="dispatched">dispatched</option>
                                <option value="expired">expired</option>
                              </select>

                              <button
                                className="p-2 hover:bg-gray-100 rounded transition-colors"
                                title="QR"
                              >
                                <QrCode className="h-4 w-4 text-medical-navy" />
                              </button>

                              <button
                                className="px-3 py-2 text-xs font-semibold rounded-lg border-2 border-vital-crimson text-vital-crimson hover:bg-vital-crimson hover:text-white transition-colors"
                                onClick={async () => {
                                  const authToken = token
                                  if (!authToken) {
                                    toast.error('Please login again')
                                    return
                                  }
                                  try {
                                    await deleteInventoryUnit({ token: authToken, unitId: unit.id })
                                    setUnits((prev) => prev.filter((u) => u.id !== unit.id))
                                    addActivity({
                                      kind: 'warning',
                                      action: 'Unit Removed',
                                      details: `${unit.bloodType} • ${unit.location}`,
                                    })
                                    toast.success('Unit removed')
                                  } catch (err) {
                                    const message = err instanceof ApiError ? err.message : 'Failed to delete unit'
                                    toast.error(message)
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUnits.map((unit, index) => {
                const daysUntilExpiry = calculateDaysUntilExpiry(unit.expiryDate)
                return (
                  <motion.div
                    key={unit.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card hover className="h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-mono text-sm text-gray-600 mb-1">{unit.id}</p>
                          <span
                            className="px-3 py-1 rounded-full text-white text-sm font-semibold inline-block"
                            style={{ backgroundColor: getBloodTypeColor(unit.bloodType) }}
                          >
                            {unit.bloodType}
                          </span>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded">
                          <QrCode className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Collection:</span>
                          <span className="font-medium">{formatDate(unit.collectionDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Expiry:</span>
                          <span className={`font-medium ${daysUntilExpiry < 7 ? 'text-vital-crimson' : ''}`}>
                            {formatDate(unit.expiryDate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            unit.status === 'available' ? 'bg-oxygen-green bg-opacity-20 text-oxygen-green' :
                            unit.status === 'reserved' ? 'bg-plasma-gold bg-opacity-20 text-plasma-gold' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {unit.status}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-600">Match Score</span>
                            <span className="font-bold">{unit.matchScore || 0}</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${unit.matchScore || 0}%` }}
                              transition={{ delay: index * 0.1 }}
                              className="h-full bg-gradient-to-r from-ai-cyan to-vital-crimson"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
