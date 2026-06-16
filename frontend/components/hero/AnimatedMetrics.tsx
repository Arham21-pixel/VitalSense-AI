'use client'

import { motion } from 'framer-motion'
import { Heart, Activity, TrendingUp } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string
  icon: React.ReactNode
  delay: number
}

function MetricCard({ label, value, icon, delay }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-background/80 rounded-xl p-3 backdrop-blur-md border border-border/50 shadow-sm transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        </div>
        <div className="text-primary opacity-80">{icon}</div>
      </div>
    </motion.div>
  )
}

export function AnimatedMetrics() {
  const metrics = [
    {
      label: 'Risk Score',
      value: '94%',
      icon: <TrendingUp size={20} />,
      delay: 0.2,
    },
    {
      label: 'HR (bpm)',
      value: '124',
      icon: <Heart size={20} />,
      delay: 0.4,
    },
    {
      label: 'SpO₂',
      value: '89%',
      icon: <Activity size={20} />,
      delay: 0.6,
    },
  ]

  return (
    <motion.div className="grid grid-cols-3 gap-3">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.label}
          {...metric}
        />
      ))}
    </motion.div>
  )
}
