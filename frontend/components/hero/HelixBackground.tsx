'use client'

import { motion } from 'framer-motion'

export function HelixBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient blobs */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#00A86B] to-[#3B82F6] rounded-full mix-blend-multiply filter blur-3xl opacity-20"
      />

      <motion.div
        animate={{
          scale: [1.1, 1, 1.1],
          rotate: [360, 180, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-[#22C55E] to-[#00A86B] rounded-full mix-blend-multiply filter blur-3xl opacity-20"
      />

      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, -180, -360],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-r from-[#3B82F6]/30 to-transparent rounded-full mix-blend-multiply filter blur-3xl opacity-15 -translate-x-1/2 -translate-y-1/2"
      />

      {/* Grid overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-10"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="grid"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke="rgba(115, 66, 226, 0.3)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="1440" height="900" fill="url(#grid)" />
      </svg>

      {/* Animated ECG-like lines */}
      <motion.svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M 0,450 Q 100,400 200,450 T 400,450 T 600,450 T 800,450 T 1000,450 T 1200,450 T 1440,450"
          stroke="url(#gradient)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00A86B" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  )
}
