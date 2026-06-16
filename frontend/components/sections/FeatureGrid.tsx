'use client'

import { motion } from 'framer-motion'
import { ScrollReveal } from '../shared/ScrollReveal'
import { GradientText } from '../shared/GradientText'
import { Zap, Lock, BarChart3, Link2, Clock, Shield } from 'lucide-react'

export function FeatureGrid() {
  const features = [
    {
      title: 'Live EMR Sync',
      description: 'Real-time integration with major EHR systems for seamless data flow',
      icon: Link2,
      color: 'from-primary to-blue-500',
    },
    {
      title: 'Proactive Forecasting',
      description: 'Predictive analytics identify at-risk patients before deterioration',
      icon: BarChart3,
      color: 'from-blue-500 to-green-500',
    },
    {
      title: 'Enterprise Grade',
      description: 'HIPAA compliant with SOC 2 Type II certification and data encryption',
      icon: Shield,
      color: 'from-green-500 to-primary',
    },
    {
      title: 'Sub-Second Latency',
      description: 'Clinical alerts delivered in milliseconds, not minutes',
      icon: Zap,
      color: 'from-primary to-green-500',
    },
    {
      title: 'Explainable AI',
      description: 'Understand exactly why VitalSense recommends specific actions',
      icon: Clock,
      color: 'from-blue-500 to-primary',
    },
    {
      title: 'Comprehensive Auditing',
      description: 'Complete audit trails for compliance and quality assurance',
      icon: Lock,
      color: 'from-green-500 to-blue-500',
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <section className="relative py-24 bg-background overflow-hidden border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4 text-balance">
            Enterprise <GradientText>Features</GradientText>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Built for the demands of modern ICU environments.
          </p>
        </ScrollReveal>

        {/* Features grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div key={feature.title} variants={item} className="h-full">
                <motion.div
                  whileHover={{ y: -4 }}
                  className="relative h-full"
                >
                  {/* Card */}
                  <div className="card-premium h-full rounded-2xl p-8 flex flex-col items-start text-left">
                    {/* Background subtle gradient on hover */}
                    <div
                      className={`absolute -inset-px bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300 pointer-events-none`}
                    />

                    {/* Icon */}
                    <motion.div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 shadow-sm`}
                      whileHover={{ scale: 1.05, rotate: 3 }}
                    >
                      <Icon size={22} />
                    </motion.div>

                    {/* Content */}
                    <div className="relative flex-1">
                      <h3 className="text-lg font-semibold text-foreground tracking-tight mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
