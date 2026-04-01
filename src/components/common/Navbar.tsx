import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, X, Bell, Search, User, Moon, Sun, 
  Droplet, LogOut, Settings as SettingsIcon 
} from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

export default function Navbar() {
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { theme, toggleTheme } = useThemeStore()

  const isDashboard = location.pathname.includes('/hospital') || location.pathname.includes('/donor')

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-medical-navy text-white shadow-lg backdrop-blur-md bg-opacity-95"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Droplet className="h-8 w-8 text-vital-crimson" fill="currentColor" />
            </motion.div>
            <span className="font-display text-xl font-bold">BloodFlow AI</span>
          </Link>

          {/* Desktop Navigation */}
          {!isDashboard && (
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="hover:text-ai-cyan transition-colors">Home</Link>
              <Link to="/#features" className="hover:text-ai-cyan transition-colors">Features</Link>
              <Link to="/#how-it-works" className="hover:text-ai-cyan transition-colors">How It Works</Link>
              <Link to="/login" className="hover:text-ai-cyan transition-colors">Login</Link>
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            {isDashboard && (
              <button className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors">
                <Search className="h-5 w-5" />
              </button>
            )}

            {/* Notifications */}
            {isDashboard && (
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors relative"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-vital-crimson rounded-full"></span>
                </button>
                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-80 bg-clinical-white text-medical-navy rounded-lg shadow-xl p-4"
                    >
                      <h3 className="font-heading font-semibold mb-2">Notifications</h3>
                      <div className="space-y-2">
                        <div className="p-2 hover:bg-gray-100 rounded cursor-pointer">
                          <p className="text-sm font-medium">O+ shortage predicted</p>
                          <p className="text-xs text-gray-500">2 hours ago</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* User Menu */}
            {isDashboard && (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-ai-cyan flex items-center justify-center">
                    <User className="h-5 w-5 text-medical-navy" />
                  </div>
                </button>
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-clinical-white text-medical-navy rounded-lg shadow-xl p-2"
                    >
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                      >
                        <SettingsIcon className="h-4 w-4" />
                        Settings
                      </Link>
                      <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded w-full text-left">
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-medical-navy border-t border-white border-opacity-20"
          >
            <div className="px-4 py-4 space-y-2">
              <Link to="/" className="block py-2 hover:text-ai-cyan">Home</Link>
              <Link to="/#features" className="block py-2 hover:text-ai-cyan">Features</Link>
              <Link to="/#how-it-works" className="block py-2 hover:text-ai-cyan">How It Works</Link>
              <Link to="/login" className="block py-2 hover:text-ai-cyan">Login</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
