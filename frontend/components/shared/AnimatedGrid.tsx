'use client'

export function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(115, 66, 226, 0.05)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="1440" height="900" fill="url(#grid)" />

        {/* Gradient spotlight */}
        <ellipse
          cx="720"
          cy="450"
          rx="600"
          ry="400"
          fill="url(#spotlight)"
          opacity="0.3"
        />
      </svg>

      {/* Radial gradient definition */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#00A86B]/5 via-transparent to-transparent blur-3xl" />
    </div>
  )
}
