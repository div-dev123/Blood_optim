import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Palette, Shield, Moon, Sun, Volume2, Mail, Smartphone } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/hospital/Sidebar'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { useThemeStore } from '../store/themeStore'
import { useAuth } from '../hooks/useAuth'
import type { DonorProfile, HospitalProfile } from '../types'

export default function Settings() {
  const { theme, toggleTheme } = useThemeStore()
  const { user, updateUser } = useAuth()

  const isHospital = user?.role === 'HOSPITAL'

  const profile = useMemo(() => {
    if (!user) return null
    return user.profile
  }, [user])

  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (!user || !profile) return

    if (user.role === 'HOSPITAL') {
      const p = profile as HospitalProfile
      setDisplayName(p.hospitalName)
      setPhone(p.phone)
      return
    }

    const p = profile as DonorProfile
    setDisplayName(`${p.firstName} ${p.lastName}`.trim())
    setPhone(p.phone)
  }, [profile, user])

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    alerts: true,
  })

  const roleSpecific = useMemo(() => {
    if (!user || !profile) return null
    if (user.role === 'HOSPITAL') {
      const p = profile as HospitalProfile
      return { label: 'License Number', value: p.license }
    }
    const p = profile as DonorProfile
    return { label: 'Blood Type', value: p.bloodType }
  }, [profile, user])

  const handleSaveProfile = () => {
    if (!user || !profile) return

    const trimmedName = displayName.trim()
    const trimmedPhone = phone.trim()

    if (!trimmedName) {
      toast.error(isHospital ? 'Hospital name is required' : 'Full name is required')
      return
    }
    if (!trimmedPhone) {
      toast.error('Phone number is required')
      return
    }

    if (user.role === 'HOSPITAL') {
      const p = profile as HospitalProfile
      updateUser({
        ...user,
        profile: {
          ...p,
          hospitalName: trimmedName,
          phone: trimmedPhone,
        },
      })
      toast.success('Profile updated')
      return
    }

    const p = profile as DonorProfile
    const parts = trimmedName.split(' ').filter(Boolean)
    const firstName = parts[0] ?? p.firstName
    const lastName = parts.slice(1).join(' ') || p.lastName

    updateUser({
      ...user,
      profile: {
        ...p,
        firstName,
        lastName,
        phone: trimmedPhone,
      },
    })
    toast.success('Profile updated')
  }

  return (
    <div className="min-h-screen bg-clinical-white">
      <Navbar />
      {isHospital && <Sidebar />}
      <div className={isHospital ? 'ml-64 p-8' : 'p-8 max-w-7xl mx-auto'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-4xl font-bold text-medical-navy mb-8">
            Settings
          </h1>

          {/* User Profile */}
          <Card className="mb-6">
            <div className="flex items-center gap-4 mb-6">
              <User className="h-12 w-12 text-medical-navy" />
              <h2 className="font-heading text-2xl font-semibold text-medical-navy">
                User Profile
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isHospital ? 'Hospital Name' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson focus:border-transparent outline-none"
                  placeholder={isHospital ? 'e.g. Central City Hospital' : 'e.g. Priya Sharma'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {roleSpecific?.label ?? 'Account'}
                </label>
                <input
                  type="text"
                  value={roleSpecific?.value ?? (isHospital ? 'Hospital' : 'Donor')}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
            </div>
            <div className="mt-6">
              <Button onClick={handleSaveProfile}>Save Changes</Button>
            </div>
          </Card>

          {/* Notification Preferences */}
          <Card className="mb-6">
            <div className="flex items-center gap-4 mb-6">
              <Bell className="h-12 w-12 text-medical-navy" />
              <h2 className="font-heading text-2xl font-semibold text-medical-navy">
                Notification Preferences
              </h2>
            </div>
            <div className="space-y-4">
              {[
                { key: 'email', label: 'Email Notifications', icon: Mail, description: 'Receive updates via email' },
                { key: 'sms', label: 'SMS Notifications', icon: Smartphone, description: 'Receive text message alerts' },
                { key: 'push', label: 'Push Notifications', icon: Bell, description: 'Browser push notifications' },
                { key: 'alerts', label: 'Critical Alerts', icon: Shield, description: 'Urgent shortage and expiry alerts' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <item.icon className="h-6 w-6 text-medical-navy" />
                    <div>
                      <p className="font-semibold text-medical-navy">{item.label}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications[item.key as keyof typeof notifications]}
                      onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-vital-crimson peer-focus:ring-opacity-20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vital-crimson"></div>
                  </label>
                </div>
              ))}
            </div>
          </Card>

          {/* Display Preferences */}
          <Card className="mb-6">
            <div className="flex items-center gap-4 mb-6">
              <Palette className="h-12 w-12 text-medical-navy" />
              <h2 className="font-heading text-2xl font-semibold text-medical-navy">
                Display Preferences
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  {theme === 'dark' ? (
                    <Moon className="h-6 w-6 text-medical-navy" />
                  ) : (
                    <Sun className="h-6 w-6 text-medical-navy" />
                  )}
                  <div>
                    <p className="font-semibold text-medical-navy">Theme</p>
                    <p className="text-sm text-gray-600">Current: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className="px-4 py-2 bg-medical-navy text-white rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Switch to {theme === 'dark' ? 'Light' : 'Dark'}
                </button>
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <Volume2 className="h-6 w-6 text-medical-navy" />
                  <div>
                    <p className="font-semibold text-medical-navy">Animation Speed</p>
                    <p className="text-sm text-gray-600">Control animation preferences</p>
                  </div>
                </div>
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson outline-none">
                  <option>Normal</option>
                  <option>Fast</option>
                  <option>Reduced Motion</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <div className="flex items-center gap-4 mb-6">
              <Shield className="h-12 w-12 text-medical-navy" />
              <h2 className="font-heading text-2xl font-semibold text-medical-navy">
                Privacy & Security
              </h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <p className="font-semibold text-medical-navy mb-2">Two-Factor Authentication</p>
                <p className="text-sm text-gray-600 mb-4">Add an extra layer of security to your account</p>
                <Button variant="outline">Enable 2FA</Button>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <p className="font-semibold text-medical-navy mb-2">Data Export</p>
                <p className="text-sm text-gray-600 mb-4">Download all your data in a portable format</p>
                <Button variant="outline">Export Data</Button>
              </div>
              <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                <p className="font-semibold text-red-700 mb-2">Delete Account</p>
                <p className="text-sm text-red-600 mb-4">Permanently delete your account and all data</p>
                <Button variant="danger" size="sm">Delete Account</Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
