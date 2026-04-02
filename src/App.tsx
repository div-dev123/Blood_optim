import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import HospitalDashboard from './pages/hospital/Dashboard'
import Inventory from './pages/hospital/Inventory'
import Predictions from './pages/hospital/Predictions'
import Redistribution from './pages/hospital/Redistribution'
import MatchScore from './pages/hospital/MatchScore'
import Analytics from './pages/hospital/Analytics'
import DonorHome from './pages/donor/Home'
import Settings from './pages/Settings'
import { AuthProvider } from './hooks/AuthProvider'
import { useAuth } from './hooks/useAuth'
import type { UserRole } from './types'

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles: UserRole[]
}) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    const onlyHospital =
      allowedRoles.length === 1 && allowedRoles[0] === 'HOSPITAL'
    const onlyDonor = allowedRoles.length === 1 && allowedRoles[0] === 'DONOR'

    const loginPath = onlyHospital
      ? '/login?role=hospital'
      : onlyDonor
        ? '/login?role=donor'
        : '/login'

    return <Navigate to={loginPath} replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={user.role === 'HOSPITAL' ? '/hospital/dashboard' : '/donor/home'}
        replace
      />
    )
  }

  return <>{children}</>
}

function AppRoutes() {
  const { user, isAuthenticated } = useAuth()

  const defaultAuthedPath =
    isAuthenticated && user
      ? user.role === 'HOSPITAL'
        ? '/hospital/dashboard'
        : '/donor/home'
      : '/'

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Role entry points */}
      <Route
        path="/hospital"
        element={<Navigate to="/hospital/dashboard" replace />}
      />
      <Route path="/donor" element={<Navigate to="/donor/home" replace />} />

      {/* Hospital routes */}
      <Route
        path="/hospital/dashboard"
        element={
          <ProtectedRoute allowedRoles={['HOSPITAL']}>
            <HospitalDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/inventory"
        element={
          <ProtectedRoute allowedRoles={['HOSPITAL']}>
            <Inventory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/predictions"
        element={
          <ProtectedRoute allowedRoles={['HOSPITAL']}>
            <Predictions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/redistribution"
        element={
          <ProtectedRoute allowedRoles={['HOSPITAL']}>
            <Redistribution />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/match-score"
        element={
          <ProtectedRoute allowedRoles={['HOSPITAL']}>
            <MatchScore />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/analytics"
        element={
          <ProtectedRoute allowedRoles={['HOSPITAL']}>
            <Analytics />
          </ProtectedRoute>
        }
      />

      {/* Donor routes */}
      <Route
        path="/donor/home"
        element={
          <ProtectedRoute allowedRoles={['DONOR']}>
            <DonorHome />
          </ProtectedRoute>
        }
      />

      {/* Shared */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={['HOSPITAL', 'DONOR']}>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={defaultAuthedPath} replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0A2463',
              color: '#F8F9FA',
            },
            success: {
              iconTheme: {
                primary: '#06FFA5',
                secondary: '#0A2463',
              },
            },
            error: {
              iconTheme: {
                primary: '#DC143C',
                secondary: '#0A2463',
              },
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
