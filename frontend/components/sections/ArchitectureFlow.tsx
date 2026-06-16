'use client'

import { motion } from 'framer-motion'
import { ScrollReveal } from '../shared/ScrollReveal'
import { GradientText } from '../shared/GradientText'
import { Building2, Lock, Zap, Database, ArrowRight } from 'lucide-react'

export function ArchitectureFlow() {
  const stages = [
    {
      title: 'Hospital Data',
      description: 'EMR, vital signs, lab results',
      icon: Building2,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Secure Gateway',
      description: 'HIPAA-compliant API layer',
      icon: Lock,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'VitalSense Engine',
      description: 'ML-powered predictions',
      icon: Zap,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Instant Alerts',
      description: 'Real-time notifications',
      icon: Database,
      color: 'bg-orange-100 text-orange-600',
    },
  ]

  return (
    <section id="enterprise" className="relative py-24 bg-muted/20 overflow-hidden border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4 text-balance">
            Enterprise <GradientText>Architecture</GradientText>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Secure, scalable, and built for healthcare at scale.
          </p>
        </ScrollReveal>

        {/* Flow diagram */}
        <ScrollReveal delay={0.2}>
          <div className="relative">
            {/* Desktop flow */}
            <div className="hidden lg:flex items-center justify-between gap-4 mb-16">
              {stages.map((stage, index) => {
                const Icon = stage.icon
                return (
                  <div key={stage.title} className="flex items-center flex-1">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -4 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex-1"
                    >
                      <div className="card-premium rounded-2xl p-6 border-2 border-transparent hover:border-primary/20 transition-all duration-200">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stage.color}`}>
                          <Icon size={22} />
                        </div>
                        <h3 className="text-base font-semibold text-foreground tracking-tight mb-1.5">
                          {stage.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{stage.description}</p>
                      </div>
                    </motion.div>

                    {/* Arrow connector */}
                    {index < stages.length - 1 && (
                      <motion.div
                        className="mx-3 flex-shrink-0"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="text-primary w-6 h-6 opacity-60" />
                      </motion.div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Animated data flow line */}
            <motion.svg
              className="hidden lg:block absolute top-14 left-0 right-0 h-12 pointer-events-none"
              viewBox="0 0 1200 48"
              preserveAspectRatio="none"
            >
              <motion.path
                d="M 50,24 L 1150,24"
                stroke="url(#archGradient)"
                strokeWidth="1.5"
                fill="none"
                strokeDasharray="6,6"
                initial={{ strokeDashoffset: 12 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              <defs>
                <linearGradient id="archGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6D28D9" />
                  <stop offset="50%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
            </motion.svg>

            {/* Mobile flow */}
            <div className="lg:hidden space-y-4">
              {stages.map((stage, index) => {
                const Icon = stage.icon
                return (
                  <motion.div
                    key={stage.title}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="card-premium rounded-xl p-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${stage.color}`}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-foreground mb-1">{stage.title}</h3>
                          <p className="text-sm text-muted-foreground">{stage.description}</p>
                        </div>
                      </div>
                    </div>
                    {index < stages.length - 1 && (
                      <div className="flex justify-center py-1.5">
                        <ArrowRight className="text-primary w-5 h-5 rotate-90 opacity-50" />
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* Compliance badges */}
        <ScrollReveal delay={0.4} className="mt-16">
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {[
                { label: 'HIPAA Compliant', detail: 'Full encryption & audit logs' },
                { label: 'SOC 2 Type II', detail: 'Annual third-party verification' },
                { label: 'GDPR Ready', detail: 'Data residency & privacy controls' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="font-semibold text-foreground tracking-tight mb-1.5">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
