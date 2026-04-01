import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Activity, Droplet } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Sidebar from '../../components/hospital/Sidebar'
import Card from '../../components/common/Card'
import { BloodType } from '../../types'
import { getBloodTypeColor, getUrgencyLevel } from '../../utils/bloodTypeUtils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const mockInventory = [
  { type: 'O+', units: 48, trend: 'up', daysUntilShortage: 2 },
  { type: 'A+', units: 32, trend: 'down', daysUntilShortage: 1 },
  { type: 'B+', units: 35, trend: 'stable', daysUntilShortage: 5 },
  { type: 'AB+', units: 18, trend: 'up', daysUntilShortage: 7 },
  { type: 'O-', units: 15, trend: 'down', daysUntilShortage: 0 },
  { type: 'A-', units: 20, trend: 'stable', daysUntilShortage: 4 },
  { type: 'B-', units: 14, trend: 'up', daysUntilShortage: 6 },
  { type: 'AB-', units: 12, trend: 'stable', daysUntilShortage: 8 },
]

const demandData = [
  { date: 'Mon', predicted: 45, actual: 42 },
  { date: 'Tue', predicted: 52, actual: 48 },
  { date: 'Wed', predicted: 38, actual: 40 },
  { date: 'Thu', predicted: 55, actual: 52 },
  { date: 'Fri', predicted: 48, actual: 45 },
  { date: 'Sat', predicted: 35, actual: 38 },
  { date: 'Sun', predicted: 42, actual: 40 },
]

const pieData = [
  { name: 'Available', value: 234, color: '#06FFA5' },
  { name: 'Reserved', value: 45, color: '#FFB627' },
  { name: 'Expiring Soon', value: 12, color: '#DC143C' },
]

export default function HospitalDashboard() {
  const [stats, setStats] = useState({
    livesSaved: 0,
    wastePrevented: 0,
    activeDonors: 0,
    utilization: 0,
  })

  useEffect(() => {
    // Animate counters
    const targets = { livesSaved: 1250, wastePrevented: 87.5, activeDonors: 3420, utilization: 92 }
    const duration = 2000
    const steps = 60
    const interval = duration / steps

    const timers = [
      setInterval(() => setStats(prev => ({ ...prev, livesSaved: Math.min(prev.livesSaved + targets.livesSaved / steps, targets.livesSaved) })), interval),
      setInterval(() => setStats(prev => ({ ...prev, wastePrevented: Math.min(prev.wastePrevented + targets.wastePrevented / steps, targets.wastePrevented) })), interval),
      setInterval(() => setStats(prev => ({ ...prev, activeDonors: Math.min(prev.activeDonors + targets.activeDonors / steps, targets.activeDonors) })), interval),
      setInterval(() => setStats(prev => ({ ...prev, utilization: Math.min(prev.utilization + targets.utilization / steps, targets.utilization) })), interval),
    ]

    setTimeout(() => timers.forEach(t => clearInterval(t)), duration)
    return () => timers.forEach(t => clearInterval(t))
  }, [])

  return (
    <div className="min-h-screen bg-clinical-white">
      <Navbar />
      <Sidebar />
      <div className="ml-64 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-4xl font-bold text-medical-navy mb-8">
            Hospital Dashboard
          </h1>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Lives Saved Today', value: Math.floor(stats.livesSaved), icon: Activity, color: 'text-oxygen-green' },
              { label: 'Waste Prevented', value: `${stats.wastePrevented.toFixed(1)}%`, icon: TrendingUp, color: 'text-plasma-gold' },
              { label: 'Active Donors', value: Math.floor(stats.activeDonors).toLocaleString(), icon: Droplet, color: 'text-ai-cyan' },
              { label: 'Utilization', value: `${stats.utilization.toFixed(0)}%`, icon: CheckCircle, color: 'text-vital-crimson' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-3xl font-display font-bold text-medical-navy">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-10 w-10 ${stat.color}`} />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Inventory Grid */}
          <div className="mb-8">
            <h2 className="font-heading text-2xl font-semibold text-medical-navy mb-4">
              Current Inventory
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {mockInventory.map((item, index) => {
                const urgency = getUrgencyLevel(item.daysUntilShortage)
                const urgencyColors = {
                  low: 'border-oxygen-green bg-oxygen-green bg-opacity-10',
                  medium: 'border-plasma-gold bg-plasma-gold bg-opacity-10',
                  high: 'border-orange-500 bg-orange-500 bg-opacity-10',
                  critical: 'border-vital-crimson bg-vital-crimson bg-opacity-10',
                }
                return (
                  <motion.div
                    key={item.type}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`border-2 ${urgencyColors[urgency]}`}>
                      <div className="text-center">
                        <div
                          className="text-2xl font-display font-bold mb-2"
                          style={{ color: getBloodTypeColor(item.type as BloodType) }}
                        >
                          {item.type}
                        </div>
                        <div className="text-3xl font-bold text-medical-navy mb-2">{item.units}</div>
                        <div className="flex items-center justify-center gap-1 text-sm">
                          {item.trend === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-oxygen-green" />
                          ) : item.trend === 'down' ? (
                            <TrendingDown className="h-4 w-4 text-vital-crimson" />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-gray-400" />
                          )}
                          <span className="text-gray-600">
                            {item.daysUntilShortage === 0 ? 'Critical' : `${item.daysUntilShortage}d left`}
                          </span>
                        </div>
                        {/* Liquid Fill Gauge */}
                        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.units / 50) * 100}%` }}
                            transition={{ delay: index * 0.1, duration: 1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: getBloodTypeColor(item.type as BloodType) }}
                          />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Demand Forecast */}
            <Card>
              <h3 className="font-heading text-xl font-semibold text-medical-navy mb-4">
                7-Day Demand Forecast
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={demandData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="predicted" stroke="#00E5FF" strokeWidth={2} name="Predicted" />
                  <Line type="monotone" dataKey="actual" stroke="#DC143C" strokeWidth={2} name="Actual" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Inventory Status */}
            <Card>
              <h3 className="font-heading text-xl font-semibold text-medical-navy mb-4">
                Inventory Status
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* AI Predictions Widget */}
          <Card className="mb-8 bg-gradient-to-r from-medical-navy to-blue-900 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-semibold">AI Predictions</h3>
              <div className="flex items-center gap-2 bg-white bg-opacity-20 px-3 py-1 rounded-full">
                <div className="h-2 w-2 bg-oxygen-green rounded-full animate-pulse" />
                <span className="text-sm">87% Confidence</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {demandData.map((day, index) => (
                <div key={index} className="text-center">
                  <p className="text-sm text-gray-300 mb-2">{day.date}</p>
                  <div className="bg-white bg-opacity-10 rounded-lg p-3">
                    <div className="text-2xl font-bold mb-1">{day.predicted}</div>
                    <div className="text-xs text-gray-300">units predicted</div>
                  </div>
                  {day.predicted > 45 && (
                    <AlertTriangle className="h-4 w-4 text-plasma-gold mx-auto mt-2" />
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <h3 className="font-heading text-xl font-semibold text-medical-navy mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {[
                { action: 'Donation Received', details: '45 units of O+ from Blood Bank A', time: '2 hours ago', icon: CheckCircle, color: 'text-oxygen-green' },
                { action: 'Units Dispatched', details: '32 units to Emergency Department', time: '4 hours ago', icon: Activity, color: 'text-ai-cyan' },
                { action: 'Shortage Resolved', details: 'A+ inventory replenished', time: '6 hours ago', icon: CheckCircle, color: 'text-oxygen-green' },
                { action: 'Alert Generated', details: 'O- shortage predicted in 2 days', time: '8 hours ago', icon: AlertTriangle, color: 'text-plasma-gold' },
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <activity.icon className={`h-5 w-5 ${activity.color}`} />
                  <div className="flex-1">
                    <p className="font-medium text-medical-navy">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.details}</p>
                  </div>
                  <span className="text-sm text-gray-500">{activity.time}</span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
