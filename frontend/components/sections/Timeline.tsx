'use client'

import { motion } from 'framer-motion'
import { ScrollReveal } from '../shared/ScrollReveal'
import { GradientText } from '../shared/GradientText'
import { Clock, Zap } from 'lucide-react'

export function Timeline() {
  const timeline = [
    {
      title: 'Traditional Care Path',
      time: '24–48 Hours',
      items: ['Patient deteriorates', 'Manual vital monitoring', 'Delayed intervention', 'Sepsis diagnosis confirmed'],
      highlight: false,
    },
    {
      title: 'VitalSense AI Path',
      time: '2–4 Hours',
      items: ['Real-time monitoring begins', 'AI predicts deterioration', 'Proactive alerts sent', 'Immediate intervention'],
      highlight: true,
    },
  ]

  return (
    <section className="relative py-24 bg-background overflow-hidden border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4 text-balance">
            From <GradientText>Hours</GradientText> to <GradientText>Minutes</GradientText>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            See how VitalSense accelerates clinical decision-making and improves patient outcomes.
          </p>
        </ScrollReveal>

        {/* Timeline comparison */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {timeline.map((path, index) => (
            <ScrollReveal key={path.title} delay={index * 0.2}>
              <motion.div
                whileHover={{ y: -4 }}
                className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                  path.highlight
                    ? 'ring-1 ring-primary/30 bg-primary/5 border border-primary/20'
                    : 'card-premium'
                }`}
              >
                <div className="relative p-8">
                  {/* Title */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground tracking-tight mb-3">
                        {path.title}
                      </h3>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                        path.highlight
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <Clock size={13} />
                        <span>{path.time}</span>
                      </div>
                    </div>
                    {path.highlight && (
                      <Zap className="text-primary w-6 h-6 flex-shrink-0 mt-1" />
                    )}
                  </div>

                  {/* Timeline items */}
                  <div className="space-y-4">
                    {path.items.map((item, i) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0, x: -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            path.highlight ? 'bg-primary' : 'bg-muted-foreground/40'
                          }`}
                        />
                        <span className={`text-sm ${path.highlight ? 'text-foreground' : 'text-muted-foreground'}`}>{item}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Footer stat */}
                  {path.highlight && (
                    <div className="mt-8 pt-6 border-t border-primary/15">
                      <p className="text-sm text-muted-foreground mb-1">Time Savings</p>
                      <p className="text-3xl font-bold gradient-text tracking-tight">1.8 Days</p>
                      <p className="text-xs text-muted-foreground mt-0.5">per ICU residency</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
