import React from 'react'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div className={`glass-effect rounded-xl p-6 ${className}`}>
      {children}
    </div>
  )
}
