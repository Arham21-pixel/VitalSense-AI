'use client'

import { motion } from 'framer-motion'
import { HelixBackground } from './HelixBackground'
import { AnimatedMetrics } from './AnimatedMetrics'
import { GradientText } from '../shared/GradientText'
import { ArrowRight, Play, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
} as const

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
} as const

export function HeroSection() {
  return (
    <section id="platform" className="relative min-h-screen bg-background pt-32 pb-16 md:pb-0 overflow-hidden flex items-center">
      <HelixBackground />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left Column */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="z-10"
        >
          {/* Eyebrow */}
          <motion.div variants={item} className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="flex h-2 w-2 rounded-full bg-primary"></span>
              <p className="text-sm font-medium text-primary">
                Clinical AI Platform
              </p>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={item} className="text-4xl md:text-5xl lg:text-7xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight text-balance">
            Predict <GradientText>Sepsis</GradientText> Before{' '}
            <GradientText>Deterioration</GradientText> with
            <br className="hidden lg:block" /> Proactive AI Scores
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={item}
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed text-pretty"
          >
            Real-time telemetry and clinical decision support. EMR-integrated
            dashboards for ICU teams. Reduce mortality, improve outcomes, and
            empower clinicians with actionable insights.
          </motion.p>

          {/* Trust Badges */}
          <motion.div variants={item} className="flex gap-6 mb-10 text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>SOC 2 Type II</span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={item} className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="w-full sm:w-auto text-base group">
              Book Demo
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
              <Play className="w-4 h-4 mr-2" />
              Watch Demo
            </Button>
          </motion.div>
        </motion.div>

        {/* Right Column - Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, x: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative z-10 hidden lg:block"
        >
          {/* Dashboard Card */}
          <div className="relative">
            {/* Glow background */}
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-3xl blur-3xl opacity-60 pointer-events-none" />

            <div className="relative card-premium rounded-2xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">PATIENT ID</p>
                  <p className="text-lg font-bold text-foreground tracking-tight">P001</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20">
                  <p className="text-xs font-bold text-destructive tracking-wide">HIGH RISK</p>
                </div>
              </div>

              {/* Risk Score Gauge */}
              <motion.div
                className="mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-muted-foreground">Risk Score</p>
                  <p className="text-3xl font-bold text-destructive tracking-tighter">94%</p>
                </div>
                <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    className="h-full bg-gradient-to-r from-destructive to-orange-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '94%' }}
                    transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                  />
                </div>
              </motion.div>

              {/* Vitals Grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'HR', value: '124', unit: 'bpm' },
                  { label: 'SpO₂', value: '89', unit: '%' },
                  { label: 'Lactate', value: '4.4', unit: 'mmol/L' },
                ].map((vital, i) => (
                  <motion.div
                    key={vital.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="bg-muted/50 rounded-xl p-3 text-center border border-border/50"
                  >
                    <p className="text-xs text-muted-foreground mb-1 font-medium">{vital.label}</p>
                    <p className="text-xl font-bold text-foreground tracking-tight">{vital.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{vital.unit}</p>
                  </motion.div>
                ))}
              </div>

              {/* Metrics */}
              <div className="space-y-3 pt-4 border-t border-border/50">
                <AnimatedMetrics />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
