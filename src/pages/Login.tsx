import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, Droplet } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Navbar from '../components/common/Navbar'
import Button from '../components/common/Button'
import { useAuth } from '../hooks/useAuth'
import { mockLogin, DEMO_HOSPITAL_USER, DEMO_DONOR_USER } from '../hooks/mockAuth'
import type { DonorProfile, HospitalProfile, UserRole } from '../types'

export default function Login() {
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('DONOR')
  const [roleLocked, setRoleLocked] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login, isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'HOSPITAL' ? '/hospital/dashboard' : '/donor/home', {
        replace: true,
      })
    }
  }, [isAuthenticated, navigate, user])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const roleParam = params.get('role')
    if (!roleParam) {
      setRoleLocked(false)
      return
    }

    const normalized = roleParam.toLowerCase()
    if (normalized === 'hospital') {
      setRole('HOSPITAL')
      setRoleLocked(true)
      return
    }

    if (normalized === 'donor') {
      setRole('DONOR')
      setRoleLocked(true)
      return
    }

    setRoleLocked(false)
  }, [location.search])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await mockLogin(email, password, role)
      login(response.user, response.token, { remember: rememberMe })

      const name =
        response.user.role === 'HOSPITAL'
          ? (response.user.profile as HospitalProfile).hospitalName
          : (response.user.profile as DonorProfile).firstName

      if (response.user.role === 'HOSPITAL') {
        navigate('/hospital/dashboard')
      } else {
        navigate('/donor/home')
      }

      toast.success(`Welcome back, ${name}!`)
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = (role: UserRole) => {
    const demoUser = role === 'HOSPITAL' ? DEMO_HOSPITAL_USER : DEMO_DONOR_USER
    login(demoUser, 'demo-token-123', { remember: true })
    if (role === 'HOSPITAL') {
      navigate('/hospital/dashboard')
    } else {
      navigate('/donor/home')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-navy via-blue-900 to-medical-navy">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-clinical-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="inline-block mb-4"
              >
                <Droplet className="h-16 w-16 text-vital-crimson" fill="currentColor" />
              </motion.div>
              <h1 className="font-display text-3xl font-bold text-medical-navy mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">Sign in to your account</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            {!roleLocked && (
              <div className="grid grid-cols-2 gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setRole('DONOR')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors border-2 ${
                    role === 'DONOR'
                      ? 'border-vital-crimson bg-vital-crimson text-white'
                      : 'border-gray-200 text-gray-700 hover:border-vital-crimson'
                  }`}
                >
                  Donor
                </button>
                <button
                  type="button"
                  onClick={() => setRole('HOSPITAL')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors border-2 ${
                    role === 'HOSPITAL'
                      ? 'border-medical-navy bg-medical-navy text-white'
                      : 'border-gray-200 text-gray-700 hover:border-medical-navy'
                  }`}
                >
                  Hospital
                </button>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson focus:border-transparent outline-none transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-vital-crimson border-gray-300 rounded focus:ring-vital-crimson"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => toast.error('Password reset is not available in this demo')}
                  className="text-sm text-vital-crimson hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" className="w-full" size="lg">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-clinical-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => toast.error('Google login is not configured in this demo')}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => toast.error('Microsoft login is not configured in this demo')}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169 0-.306.137-.306.306v7.068c0 .169.137.306.306.306h-1.84c-.169 0-.306-.137-.306-.306V8.466c0-.169.137-.306.306-.306h1.84zm-2.84 2.16c-.169 0-.306.137-.306.306v4.908c0 .169.137.306.306.306h-1.84c-.169 0-.306-.137-.306-.306V10.626c0-.169.137-.306.306-.306h1.84zm-2.84 2.16c-.169 0-.306.137-.306.306v2.748c0 .169.137.306.306.306h-1.84c-.169 0-.306-.137-.306-.306V12.786c0-.169.137-.306.306-.306h1.84z"/>
                  </svg>
                  Microsoft
                </button>
              </div>

              {/* Demo logins */}
              <div className="space-y-3">
                {(role === 'HOSPITAL' || !roleLocked) && (
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('HOSPITAL')}
                    className="w-full border-2 border-medical-navy text-medical-navy py-3 rounded-lg font-semibold hover:bg-medical-navy hover:text-white transition-colors"
                  >
                    Login as Hospital Admin
                  </button>
                )}
                {(role === 'DONOR' || !roleLocked) && (
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('DONOR')}
                    className="w-full border-2 border-vital-crimson text-vital-crimson py-3 rounded-lg font-semibold hover:bg-vital-crimson hover:text-white transition-colors"
                  >
                    Login as Donor
                  </button>
                )}
              </div>

              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-vital-crimson font-semibold hover:underline">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
