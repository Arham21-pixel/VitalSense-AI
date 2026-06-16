'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface CountUpNumberProps {
  from?: number
  to: number
  duration?: number
  suffix?: string
  prefix?: string
  className?: string
}

export function CountUpNumber({
  from = 0,
  to,
  duration = 2,
  suffix = '',
  prefix = '',
  className = '',
}: CountUpNumberProps) {
  const [count, setCount] = useState(from)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return

    let start: number | null = null
    const animate = (timestamp: number) => {
      if (!start) start = timestamp
      const progress = (timestamp - start) / (duration * 1000)

      if (progress < 1) {
        setCount(Math.floor(from + (to - from) * progress))
        requestAnimationFrame(animate)
      } else {
        setCount(to)
      }
    }

    requestAnimationFrame(animate)
  }, [isInView, from, to, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}
