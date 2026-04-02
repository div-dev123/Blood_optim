import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplet, ArrowRight, ArrowLeft, Building2, User, Mail, Lock, Phone } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Navbar from '../components/common/Navbar'
import Button from '../components/common/Button'
import { useAuth } from '../hooks/useAuth'
import { registerUser } from '../api/auth'
import type { BloodType } from '../types'
import { ApiError } from '../utils/apiClient'

type UserType = 'HOSPITAL' | 'DONOR' | null

export default function Register() {
  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState<UserType>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    bloodType: '',
    hospitalLicense: '',
  })
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleComplete = async () => {
    if (!userType) return

    try {
      const response = await registerUser({
        email: formData.email,
        password: formData.password,
        role: userType,
        name: formData.name,
        phone: formData.phone,
        bloodType: userType === 'DONOR' ? (formData.bloodType as BloodType) : undefined,
        hospitalLicense: userType === 'HOSPITAL' ? formData.hospitalLicense : undefined,
      })

      login(response.user, response.token)

      toast.success(
        userType === 'HOSPITAL'
          ? 'Hospital account created successfully'
          : 'Donor account created successfully',
      )

      navigate(userType === 'HOSPITAL' ? '/hospital/dashboard' : '/donor/home')
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Registration failed')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 2 && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (step < 4) {
      setStep(step + 1)
    } else {
      await handleComplete()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-navy via-blue-900 to-medical-navy">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
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
                Create Your Account
              </h1>
              <p className="text-gray-600">Join the blood donation revolution</p>
            </div>

            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        step >= s
                          ? 'bg-vital-crimson text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {s}
                    </div>
                    {s < 4 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          step > s ? 'bg-vital-crimson' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {/* Step 1: User Type */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="font-heading text-2xl font-semibold text-medical-navy mb-4">
                      I am a...
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setUserType('HOSPITAL')}
                        className={`p-6 border-2 rounded-xl transition-all ${
                          userType === 'HOSPITAL'
                            ? 'border-vital-crimson bg-vital-crimson bg-opacity-10'
                            : 'border-gray-300 hover:border-vital-crimson'
                        }`}
                      >
                        <Building2 className="h-12 w-12 mx-auto mb-3 text-vital-crimson" />
                        <h3 className="font-heading font-semibold">Hospital</h3>
                        <p className="text-sm text-gray-600 mt-2">Manage inventory and predictions</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserType('DONOR')}
                        className={`p-6 border-2 rounded-xl transition-all ${
                          userType === 'DONOR'
                            ? 'border-vital-crimson bg-vital-crimson bg-opacity-10'
                            : 'border-gray-300 hover:border-vital-crimson'
                        }`}
                      >
                        <User className="h-12 w-12 mx-auto mb-3 text-vital-crimson" />
                        <h3 className="font-heading font-semibold">Donor</h3>
                        <p className="text-sm text-gray-600 mt-2">Donate blood and save lives</p>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Basic Info */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="font-heading text-2xl font-semibold text-medical-navy mb-4">
                      Basic Information
                    </h2>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {userType === 'HOSPITAL' ? 'Hospital Name' : 'Full Name'}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson focus:border-transparent outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson focus:border-transparent outline-none"
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
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson focus:border-transparent outline-none"
                          required
                        />
                      </div>
                      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            formData.password.length < 6
                              ? 'bg-red-500 w-1/3'
                              : formData.password.length < 10
                              ? 'bg-yellow-500 w-2/3'
                              : 'bg-green-500 w-full'
                          }`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson focus:border-transparent outline-none"
                        required
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Role-specific */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="font-heading text-2xl font-semibold text-medical-navy mb-4">
                      {userType === 'HOSPITAL' ? 'Hospital Details' : 'Donor Information'}
                    </h2>
                    {userType === 'HOSPITAL' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hospital License Number
                        </label>
                        <input
                          type="text"
                          value={formData.hospitalLicense}
                          onChange={(e) => setFormData({ ...formData, hospitalLicense: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson focus:border-transparent outline-none"
                          required
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Blood Type
                        </label>
                        <select
                          value={formData.bloodType}
                          onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson focus:border-transparent outline-none"
                          required
                        >
                          <option value="">Select blood type</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson focus:border-transparent outline-none"
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Verification */}
                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 text-center"
                  >
                    <h2 className="font-heading text-2xl font-semibold text-medical-navy mb-4">
                      Verify Your Email
                    </h2>
                    <p className="text-gray-600 mb-6">
                      We've sent a verification code to {formData.email}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <input
                          key={i}
                          type="text"
                          maxLength={1}
                          className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-vital-crimson focus:border-vital-crimson outline-none"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">
                      Didn't receive the code?{' '}
                      <button type="button" className="text-vital-crimson hover:underline">
                        Resend
                      </button>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-between mt-8">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                  >
                    <ArrowLeft className="mr-2 inline" />
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  className={step === 1 ? 'ml-auto' : ''}
                  disabled={step === 1 && !userType}
                >
                  {step === 4 ? 'Complete Registration' : 'Continue'}
                  {step < 4 && <ArrowRight className="ml-2 inline" />}
                </Button>
              </div>

              <p className="text-center text-sm text-gray-600 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-vital-crimson font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
