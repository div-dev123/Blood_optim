import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  MapPin,
  Target,
  BarChart3,
  Settings,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/hospital/dashboard' },
  { icon: Package, label: 'Inventory', path: '/hospital/inventory' },
  { icon: TrendingUp, label: 'AI Predictions', path: '/hospital/predictions' },
  { icon: MapPin, label: 'Redistribution', path: '/hospital/redistribution' },
  { icon: Target, label: 'Match Score', path: '/hospital/match-score' },
  { icon: BarChart3, label: 'Analytics', path: '/hospital/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

export default function Sidebar() {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className={clsx(
        'bg-medical-navy text-white h-screen fixed left-0 top-0 z-40 transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-white border-opacity-20">
          {!isCollapsed && (
            <h2 className="font-display text-xl font-bold">BloodFlow AI</h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all group',
                  isActive
                    ? 'bg-vital-crimson text-white shadow-lg'
                    : 'hover:bg-white hover:bg-opacity-10 text-gray-300'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-heading font-medium">{item.label}</span>
                )}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-medical-navy text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </motion.aside>
  )
}
