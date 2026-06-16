'use client'

import { motion } from 'framer-motion'
import { ScrollReveal } from '../shared/ScrollReveal'
import { GradientText } from '../shared/GradientText'
import { ArrowRight, Database, Brain, Zap } from 'lucide-react'

export function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Ingest',
      description: 'Real-time data from EMR systems, vital monitors, and lab equipment',
      icon: Database,
      color: 'from-primary to-blue-500',
    },
    {
      number: '02',
      title: 'Score',
      description: 'AI algorithms process telemetry and predict sepsis risk in milliseconds',
      icon: Brain,
      color: 'from-blue-500 to-green-500',
    },
    {
      number: '03',
      title: 'Act',
      description: 'Clinicians receive actionable alerts and recommendations instantly',
      icon: Zap,
      color: 'from-green-500 to-primary',
    },
  ]

  return (
    <section id="how-it-works" className="relative py-24 bg-muted/30 overflow-hidden border-y border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4 text-balance">
            How <GradientText>VitalSense</GradientText> Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Three simple steps to transform your ICU&apos;s clinical outcomes.
          </p>
        </ScrollReveal>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <ScrollReveal key={step.number} delay={index * 0.2}>
                <motion.div whileHover={{ y: -4 }} className="relative">
                  {/* Card */}
                  <div className="card-premium rounded-2xl p-8 h-full">
                    {/* Number */}
                    <div className="mb-6">
                      <span className="text-6xl font-bold gradient-text opacity-40">
                        {step.number}
                      </span>
                    </div>

                    {/* Icon */}
                    <motion.div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white mb-6 shadow-sm`}
                      whileHover={{ scale: 1.05, rotate: 3 }}
                    >
                      <Icon size={24} />
                    </motion.div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-foreground tracking-tight mb-3">{step.title}</h3>

                    {/* Description */}
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>

                  {/* Arrow connector */}
                  {index < steps.length - 1 && (
                    <motion.div
                      className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10"
                      animate={{ x: [0, 6, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <ArrowRight className="text-primary w-7 h-7" />
                    </motion.div>
                  )}
                </motion.div>
              </ScrollReveal>
            )
          })}
        </div>

        {/* Connected flow visualization */}
        <ScrollReveal delay={0.6}>
          <motion.div className="relative h-20">
            <motion.svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 1200 80"
              preserveAspectRatio="none"
            >
              <motion.path
                d="M 0,40 Q 300,0 600,40 T 1200,40"
                stroke="url(#flowGradient)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.4 }}
                transition={{ duration: 1.5 }}
              />
              <defs>
                <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6D28D9" />
                  <stop offset="50%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
            </motion.svg>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  )
}
