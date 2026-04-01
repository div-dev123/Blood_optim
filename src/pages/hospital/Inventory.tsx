import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Download, Plus, QrCode } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Sidebar from '../../components/hospital/Sidebar'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { BloodUnit, BloodType } from '../../types'
import { getBloodTypeColor, calculateDaysUntilExpiry } from '../../utils/bloodTypeUtils'
import { formatDate } from '../../utils/dateHelpers'
import mockBloodUnits from '../../data/mockBloodUnits.json'

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBloodType, setSelectedBloodType] = useState<BloodType | 'all'>('all')
  const [viewMode] = useState<'table' | 'grid'>('table')
  const [units] = useState<BloodUnit[]>(mockBloodUnits as BloodUnit[])

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
              <Button variant="outline">
                <Download className="mr-2 inline" />
                Export
              </Button>
              <Button>
                <Plus className="mr-2 inline" />
                Add Unit
              </Button>
            </div>
          </div>

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
                            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                              <QrCode className="h-4 w-4 text-medical-navy" />
                            </button>
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
