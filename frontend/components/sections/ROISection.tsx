'use client'

import { motion } from 'framer-motion'
import { ScrollReveal } from '../shared/ScrollReveal'
import { CountUpNumber } from '../shared/CountUpNumber'
import { GradientText } from '../shared/GradientText'
import { TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ROISection() {
  const metrics = [
    {
      value: 14.2,
      unit: '%',
      label: 'Reduction in ICU Mortality',
      description: 'Demonstrated improvement in patient survival rates',
      color: 'from-primary to-blue-500',
      delay: 0,
    },
    {
      value: 1.8,
      unit: 'Days',
      label: 'Saved per ICU Residency',
      description: 'Shorter length of stay due to earlier intervention',
      color: 'from-blue-500 to-green-500',
      delay: 0.2,
    },
    {
      value: 240,
      unit: 'K',
      label: 'Annual Savings per Ward',
      description: 'USD in reduced complications and readmissions',
      color: 'from-green-500 to-primary',
      delay: 0.4,
    },
  ]

  return (
    <section id="roi" className="relative py-24 bg-background overflow-hidden border-t border-border/40">
      {/* Subtle background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4 text-balance">
            Measurable <GradientText>Clinical ROI</GradientText>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Real outcomes from hospitals implementing VitalSense.
          </p>
        </ScrollReveal>

        {/* Metrics grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {metrics.map((metric) => (
            <ScrollReveal key={metric.label} delay={metric.delay}>
              <motion.div whileHover={{ y: -6 }} className="relative h-full">
                {/* Card */}
                <div className="card-premium h-full rounded-2xl p-8">
                  {/* Icon */}
                  <motion.div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center text-white mb-6 shadow-sm`}
                    whileHover={{ scale: 1.05, rotate: -3 }}
                  >
                    <TrendingUp size={24} />
                  </motion.div>

                  {/* Value */}
                  <div className="mb-4">
                    <div className="text-5xl md:text-6xl font-bold flex items-baseline gap-1 tracking-tight">
                      <CountUpNumber
                        to={metric.value}
                        duration={2}
                        className="gradient-text"
                      />
                      <span className="text-3xl font-bold text-muted-foreground">
                        {metric.unit}
                      </span>
                    </div>
                  </div>

                  {/* Label */}
                  <h3 className="text-lg font-semibold text-foreground tracking-tight mb-2">
                    {metric.label}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm leading-relaxed">{metric.description}</p>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        {/* CTA */}
        <ScrollReveal delay={0.6} className="text-center">
          <Button size="lg">
            Download ROI Case Study
          </Button>
        </ScrollReveal>
      </div>
    </section>
  )
}
