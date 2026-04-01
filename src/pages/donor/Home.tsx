import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, MapPin, Award, Calendar, TrendingUp, Gift, Target } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { BloodType } from '../../types'
import { getBloodTypeColor } from '../../utils/bloodTypeUtils'

const mockDonations = [
  { date: '2026-01-15', location: 'Blood Bank A', units: 1 },
  { date: '2025-11-20', location: 'Mobile Camp', units: 1 },
  { date: '2025-09-10', location: 'Blood Bank B', units: 1 },
]

const mockAchievements = [
  { name: 'First Donation', icon: Heart, unlocked: true, date: '2025-09-10' },
  { name: '5 Donations', icon: Award, unlocked: true, date: '2026-01-15' },
  { name: '10 Donations', icon: Target, unlocked: false },
  { name: 'Lifesaver', icon: Gift, unlocked: false },
]

const nearbyOpportunities = [
  { name: 'Blood Bank Central', distance: '2.3 km', need: 'Critical', bloodTypes: ['O+', 'A+'], impact: 95 },
  { name: 'Emergency Center', distance: '5.1 km', need: 'High', bloodTypes: ['B+'], impact: 88 },
  { name: 'Regional Hospital', distance: '8.7 km', need: 'Medium', bloodTypes: ['O-'], impact: 75 },
]

export default function DonorHome() {
  const [creditScore] = useState(850)
  const [totalDonations] = useState(5)
  const [livesTouched] = useState(15)
  const [nextEligible] = useState('2026-03-15')

  return (
    <div className="min-h-screen bg-clinical-white">
      <Navbar />
      <div className="p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold text-medical-navy mb-2">
              Welcome Back, Donor!
            </h1>
            <p className="text-gray-600">Your impact matters. Every donation saves lives.</p>
          </div>

          {/* Credit Score Display */}
          <Card className="mb-8 bg-gradient-to-r from-medical-navy to-blue-900 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 mb-2">Donor Credit Score</p>
                <div className="text-6xl font-display font-bold mb-2">{creditScore}</div>
                <p className="text-gray-300">Excellent • Top 5% of donors</p>
              </div>
              <div className="text-right">
                <div className="text-3xl mb-2">🏆</div>
                <p className="text-sm text-gray-300">Level 5 Donor</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white border-opacity-20">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{totalDonations}</div>
                  <div className="text-sm text-gray-300">Total Donations</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{livesTouched}</div>
                  <div className="text-sm text-gray-300">Lives Touched</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">45d</div>
                  <div className="text-sm text-gray-300">Next Eligible</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { icon: Heart, label: 'Lives Saved', value: livesTouched, color: 'text-vital-crimson' },
              { icon: TrendingUp, label: 'Impact Score', value: creditScore, color: 'text-ai-cyan' },
              { icon: Award, label: 'Achievements', value: mockAchievements.filter(a => a.unlocked).length, color: 'text-plasma-gold' },
              { icon: Calendar, label: 'Next Donation', value: nextEligible.split('-')[2], color: 'text-oxygen-green' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <stat.icon className={`h-8 w-8 ${stat.color} mb-3`} />
                  <div className="text-3xl font-display font-bold text-medical-navy mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Nearby Opportunities */}
            <Card>
              <h2 className="font-heading text-2xl font-semibold text-medical-navy mb-4">
                Nearby Donation Opportunities
              </h2>
              <div className="space-y-4">
                {nearbyOpportunities.map((opp, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-medical-navy mb-1">{opp.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {opp.distance} away
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        opp.need === 'Critical' ? 'bg-vital-crimson text-white' :
                        opp.need === 'High' ? 'bg-plasma-gold text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {opp.need} Need
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      {opp.bloodTypes.map(type => (
                        <span
                          key={type}
                          className="px-2 py-1 rounded text-xs text-white font-semibold"
                          style={{ backgroundColor: getBloodTypeColor(type as BloodType) }}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Impact Score</span>
                          <span className="text-sm font-semibold">{opp.impact}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-ai-cyan to-vital-crimson"
                            style={{ width: `${opp.impact}%` }}
                          />
                        </div>
                      </div>
                      <Button size="sm" className="ml-4">
                        Book Now
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Achievements */}
            <Card>
              <h2 className="font-heading text-2xl font-semibold text-medical-navy mb-4">
                Achievements & Badges
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {mockAchievements.map((achievement, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-2 text-center ${
                      achievement.unlocked
                        ? 'border-plasma-gold bg-plasma-gold bg-opacity-10'
                        : 'border-gray-200 bg-gray-50 opacity-50'
                    }`}
                  >
                    <achievement.icon className={`h-8 w-8 mx-auto mb-2 ${
                      achievement.unlocked ? 'text-plasma-gold' : 'text-gray-400'
                    }`} />
                    <p className="text-sm font-semibold text-medical-navy mb-1">
                      {achievement.name}
                    </p>
                    {achievement.unlocked && achievement.date && (
                      <p className="text-xs text-gray-600">Unlocked {achievement.date}</p>
                    )}
                    {!achievement.unlocked && (
                      <p className="text-xs text-gray-500">Locked</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>

          {/* Donation History */}
          <Card>
            <h2 className="font-heading text-2xl font-semibold text-medical-navy mb-4">
              Donation History
            </h2>
            <div className="space-y-4">
              {mockDonations.map((donation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="h-12 w-12 rounded-full bg-vital-crimson bg-opacity-10 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-vital-crimson" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-medical-navy">{donation.location}</p>
                    <p className="text-sm text-gray-600">{donation.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-medical-navy">{donation.units} unit</p>
                    <Button size="sm" variant="ghost" className="mt-2">
                      Download Certificate
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
