import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp, Shield, Zap, Heart, Users, Award, Target } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Button from '../components/common/Button'
import Card from '../components/common/Card'

export default function Landing() {
  const [counts, setCounts] = useState({ lives: 0, units: 0, waste: 0 })

  useEffect(() => {
    // Animated counter effect
    const duration = 2000
    const steps = 60
    const increment = (target: number) => target / steps
    const interval = duration / steps

    const timers = [
      setInterval(() => setCounts(prev => ({ ...prev, lives: Math.min(prev.lives + increment(125000), 125000) })), interval),
      setInterval(() => setCounts(prev => ({ ...prev, units: Math.min(prev.units + increment(45000), 45000) })), interval),
      setInterval(() => setCounts(prev => ({ ...prev, waste: Math.min(prev.waste + increment(12.5), 12.5) })), interval),
    ]

    setTimeout(() => {
      timers.forEach(timer => clearInterval(timer))
      setCounts({ lives: 125000, units: 45000, waste: 12.5 })
    }, duration)

    return () => timers.forEach(timer => clearInterval(timer))
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-navy via-blue-900 to-medical-navy">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-vital-crimson rounded-full opacity-30"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                y: [null, Math.random() * window.innerHeight],
                x: [null, Math.random() * window.innerWidth],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.h1
              className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              AI-Powered Blood Donation
              <br />
              <span className="bg-gradient-to-r from-ai-cyan to-vital-crimson bg-clip-text text-transparent">
                Revolution
              </span>
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Predict demand, prevent wastage, and save lives with cutting-edge AI technology
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Join as Donor <ArrowRight className="ml-2 inline" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Hospital Login
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats Counter */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[
              { icon: Heart, value: Math.floor(counts.lives).toLocaleString(), label: 'Lives Saved', color: 'text-vital-crimson' },
              { icon: TrendingUp, value: Math.floor(counts.units).toLocaleString(), label: 'Units Distributed', color: 'text-ai-cyan' },
              { icon: Target, value: `${counts.waste.toFixed(1)}%`, label: 'Waste Prevented', color: 'text-oxygen-green' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20"
              >
                <stat.icon className={`h-8 w-8 ${stat.color} mb-4`} />
                <div className="text-4xl font-display font-bold text-white mb-2">{stat.value}</div>
                <div className="text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section id="problem" className="py-20 bg-clinical-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-medical-navy mb-4">
              The Blood Crisis
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every year, millions of units of blood are wasted while shortages occur simultaneously
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { number: '2M+', title: 'Units Wasted Annually', description: 'Blood expires before it can save lives' },
              { number: '30%', title: 'Shortage Rate', description: 'Hospitals face critical shortages regularly' },
              { number: '$1.2B', title: 'Economic Loss', description: 'Wasted resources and emergency procurement costs' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover>
                  <div className="text-5xl font-display font-bold text-vital-crimson mb-4">{stat.number}</div>
                  <h3 className="font-heading text-xl font-semibold mb-2">{stat.title}</h3>
                  <p className="text-gray-600">{stat.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Showcase */}
      <section id="features" className="py-20 bg-gradient-to-br from-medical-navy to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Our Solution
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Four revolutionary features powered by AI
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: 'AI Forecasting', description: 'Predict demand 7 days ahead with 87% accuracy', color: 'text-ai-cyan' },
              { icon: TrendingUp, title: 'Smart Redistribution', description: 'Automatically route blood to where it\'s needed', color: 'text-oxygen-green' },
              { icon: Shield, title: 'Match Score', description: 'AI-powered compatibility scoring for optimal matches', color: 'text-plasma-gold' },
              { icon: Users, title: 'Donor Marketplace', description: 'Connect donors with urgent needs in real-time', color: 'text-vital-crimson' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10, rotateY: 5 }}
                className="perspective-1000"
              >
                <Card hover className="h-full bg-white bg-opacity-10 backdrop-blur-md border-white border-opacity-20 text-white">
                  <feature.icon className={`h-12 w-12 ${feature.color} mb-4`} />
                  <h3 className="font-heading text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-clinical-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-medical-navy mb-4">
              How It Works
            </h2>
          </motion.div>

          <div className="relative">
            {[
              { step: 1, title: 'Data Collection', description: 'Real-time inventory and demand data from hospitals' },
              { step: 2, title: 'AI Analysis', description: 'Machine learning models predict future demand patterns' },
              { step: 3, title: 'Optimization', description: 'Smart algorithms redistribute blood efficiently' },
              { step: 4, title: 'Action', description: 'Automated alerts and recommendations for staff' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="flex items-start gap-6 mb-8"
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-vital-crimson text-white flex items-center justify-center font-display text-2xl font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-heading text-2xl font-semibold text-medical-navy mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-lg">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 bg-gradient-to-r from-vital-crimson to-medical-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Ready to Save Lives?
            </h2>
            <p className="text-xl mb-8 text-gray-200">
              Join thousands of hospitals and donors making a difference
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Get Started <ArrowRight className="ml-2 inline" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-medical-navy">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-medical-navy text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-6 w-6 text-vital-crimson" />
                <span className="font-display text-xl font-bold text-white">BloodFlow AI</span>
              </div>
              <p className="text-sm">Revolutionizing blood donation with AI</p>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-white mb-4">About</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-ai-cyan">Our Mission</a></li>
                <li><a href="#" className="hover:text-ai-cyan">Team</a></li>
                <li><a href="#" className="hover:text-ai-cyan">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-ai-cyan">Documentation</a></li>
                <li><a href="#" className="hover:text-ai-cyan">API</a></li>
                <li><a href="#" className="hover:text-ai-cyan">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>support@bloodflow.ai</li>
                <li>+1 (555) 123-4567</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 BloodFlow AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
