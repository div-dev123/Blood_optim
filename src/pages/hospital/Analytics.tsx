import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Sidebar from '../../components/hospital/Sidebar'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts'

const donutData = [
  { name: 'O+', value: 35, color: '#E63946' },
  { name: 'A+', value: 25, color: '#F77F00' },
  { name: 'B+', value: 18, color: '#06AED5' },
  { name: 'AB+', value: 12, color: '#9D4EDD' },
  { name: 'O-', value: 6, color: '#DC143C' },
  { name: 'A-', value: 4, color: '#FF9500' },
]

const trendData = [
  { month: 'Jan', donations: 420, demand: 380 },
  { month: 'Feb', donations: 450, demand: 410 },
  { month: 'Mar', donations: 480, demand: 450 },
  { month: 'Apr', donations: 520, demand: 480 },
  { month: 'May', donations: 550, demand: 520 },
  { month: 'Jun', donations: 580, demand: 550 },
]

const efficiencyData = [
  { category: 'Waste Reduction', value: 87.5, target: 90 },
  { category: 'Shortage Prevention', value: 92.3, target: 95 },
  { category: 'Match Accuracy', value: 94.1, target: 95 },
  { category: 'Redistribution Efficiency', value: 89.7, target: 90 },
]

export default function Analytics() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('monthly')

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
                Analytics & Reports
              </h1>
              <p className="text-gray-600">Comprehensive insights and performance metrics</p>
            </div>
            <div className="flex gap-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
              <Button variant="outline">
                <Download className="mr-2 inline" />
                Export Report
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Waste Reduction', value: '87.5%', trend: '+2.3%', icon: TrendingUp, color: 'text-oxygen-green' },
              { label: 'Shortage Accuracy', value: '92.3%', trend: '+1.8%', icon: TrendingUp, color: 'text-oxygen-green' },
              { label: 'Avg Match Score', value: '94.1', trend: '+2.1', icon: TrendingUp, color: 'text-ai-cyan' },
              { label: 'Donor Retention', value: '78.5%', trend: '-1.2%', icon: TrendingDown, color: 'text-plasma-gold' },
            ].map((kpi, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{kpi.label}</span>
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  <div className="text-3xl font-display font-bold text-medical-navy mb-1">{kpi.value}</div>
                  <div className={`text-sm ${kpi.color}`}>{kpi.trend}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Blood Type Distribution */}
            <Card>
              <h3 className="font-heading text-xl font-semibold text-medical-navy mb-4">
                Blood Type Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Demand Trends */}
            <Card>
              <h3 className="font-heading text-xl font-semibold text-medical-navy mb-4">
                Donations vs Demand Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="donations" stroke="#06FFA5" strokeWidth={3} name="Donations" />
                  <Line type="monotone" dataKey="demand" stroke="#DC143C" strokeWidth={2} name="Demand" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Efficiency Metrics */}
          <Card className="mb-8">
            <h3 className="font-heading text-xl font-semibold text-medical-navy mb-4">
              Performance Metrics
            </h3>
            <div className="space-y-4">
              {efficiencyData.map((metric, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-medical-navy">{metric.category}</span>
                    <span className="text-sm text-gray-600">
                      {metric.value}% / Target: {metric.target}%
                    </span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(metric.value / metric.target) * 100}%` }}
                      transition={{ delay: index * 0.1, duration: 1 }}
                      className={`h-full rounded-full ${
                        metric.value >= metric.target ? 'bg-oxygen-green' : 'bg-plasma-gold'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Report Generator */}
          <Card>
            <h3 className="font-heading text-xl font-semibold text-medical-navy mb-4">
              Generate Custom Report
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none"
                />
              </div>
            </div>
            <div className="mt-6">
              <Button>
                <Calendar className="mr-2 inline" />
                Generate Report
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
