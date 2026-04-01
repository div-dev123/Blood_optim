import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Truck, Clock, AlertCircle } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Sidebar from '../../components/hospital/Sidebar'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { Redistribution as RedistributionType, BloodType } from '../../types'
import { getBloodTypeColor } from '../../utils/bloodTypeUtils'

const mockRedistributions: RedistributionType[] = [
  {
    id: 'R-001',
    fromLocation: 'Blood Bank A',
    toLocation: 'Hospital Central',
    bloodTypes: ['O+', 'A+'],
    units: 45,
    status: 'approved',
    urgency: 'high',
    eta: '2 hours',
  },
  {
    id: 'R-002',
    fromLocation: 'Blood Bank B',
    toLocation: 'Emergency Center',
    bloodTypes: ['B+'],
    units: 20,
    status: 'in-transit',
    urgency: 'critical',
    eta: '30 minutes',
  },
  {
    id: 'R-003',
    fromLocation: 'Blood Bank C',
    toLocation: 'Regional Hospital',
    bloodTypes: ['AB+', 'O-'],
    units: 32,
    status: 'requested',
    urgency: 'medium',
  },
]

const statusColors = {
  requested: 'bg-plasma-gold bg-opacity-20 text-plasma-gold',
  approved: 'bg-ai-cyan bg-opacity-20 text-ai-cyan',
  'in-transit': 'bg-blue-500 bg-opacity-20 text-blue-600',
  delivered: 'bg-oxygen-green bg-opacity-20 text-oxygen-green',
}

export default function Redistribution() {
  const [redistributions] = useState<RedistributionType[]>(mockRedistributions)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const filtered = selectedStatus === 'all'
    ? redistributions
    : redistributions.filter(r => r.status === selectedStatus)

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
                Redistribution Center
              </h1>
              <p className="text-gray-600">Optimize blood movement between locations (RL coming soon)</p>
            </div>
            <Button disabled>
              Optimize Routes (RL coming soon)
            </Button>
          </div>

          {/* Status Filter */}
          <Card className="mb-6">
            <div className="flex gap-2 flex-wrap">
              {['all', 'requested', 'approved', 'in-transit', 'delivered'].map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                    selectedStatus === status
                      ? 'bg-vital-crimson text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('-', ' ')}
                </button>
              ))}
            </div>
          </Card>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {['requested', 'approved', 'in-transit', 'delivered'].map((status, colIndex) => {
              const statusItems = filtered.filter(r => r.status === status)
              return (
                <motion.div
                  key={status}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: colIndex * 0.1 }}
                >
                  <Card>
                    <h3 className="font-heading text-lg font-semibold text-medical-navy mb-4 capitalize">
                      {status.replace('-', ' ')} ({statusItems.length})
                    </h3>
                    <div className="space-y-4">
                      {statusItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-move"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-mono text-sm text-gray-600 mb-1">{item.id}</p>
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium">{item.fromLocation}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium">{item.toLocation}</span>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[item.status]}`}>
                              {item.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {item.bloodTypes.map(type => (
                              <span
                                key={type}
                                className="px-2 py-1 rounded text-xs text-white font-semibold"
                                style={{ backgroundColor: getBloodTypeColor(type as BloodType) }}
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{item.units} units</span>
                            {item.eta && (
                              <span className="flex items-center gap-1 text-gray-600">
                                <Clock className="h-3 w-3" />
                                {item.eta}
                              </span>
                            )}
                          </div>
                          {item.urgency === 'critical' && (
                            <div className="mt-2 flex items-center gap-1 text-vital-crimson text-xs">
                              <AlertCircle className="h-3 w-3" />
                              Critical urgency
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Map Visualization Placeholder */}
          <Card>
            <h3 className="font-heading text-xl font-semibold text-medical-navy mb-4">
              Route Map
            </h3>
            <div className="h-96 bg-gradient-to-br from-medical-navy to-blue-900 rounded-lg flex items-center justify-center relative overflow-hidden">
              {/* Simulated map with animated routes */}
              {redistributions.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="absolute"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: index * 0.3, repeat: Infinity }}
                >
                  <svg width="800" height="400" className="opacity-50">
                    <motion.line
                      x1={100 + index * 150}
                      y1={100 + index * 50}
                      x2={300 + index * 100}
                      y2={200 + index * 80}
                      stroke="#00E5FF"
                      strokeWidth="3"
                      strokeDasharray="5,5"
                    />
                    <circle cx={100 + index * 150} cy={100 + index * 50} r="8" fill="#DC143C" />
                    <circle cx={300 + index * 100} cy={200 + index * 80} r="8" fill="#06FFA5" />
                  </svg>
                </motion.div>
              ))}
              <div className="relative z-10 text-white text-center">
                <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-heading">Interactive Route Visualization</p>
                <p className="text-sm text-gray-300 mt-2">Showing {redistributions.length} active routes</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
