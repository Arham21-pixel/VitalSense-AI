export function LogoIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path 
        d="M50 85 C50 85 15 58 15 35 C15 15 35 10 50 25 C65 10 85 15 85 35 C85 38 84 41 82 45" 
        stroke="#1ba081" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none" 
      />
      
      <path d="M22 55 L35 55 L42 35 L52 72 L62 50 L72 50" stroke="#fbbd0e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      <path d="M65 35 L85 35" stroke="#1ba081" strokeWidth="5" strokeLinecap="round" fill="none" />
      <circle cx="90" cy="35" r="3" stroke="#1ba081" strokeWidth="4" fill="white" />
      
      <path d="M72 45 L93 45" stroke="#1ba081" strokeWidth="5" strokeLinecap="round" fill="none" />
      <circle cx="98" cy="45" r="3" stroke="#1ba081" strokeWidth="4" fill="white" />
      
      <path d="M65 55 L85 55" stroke="#1ba081" strokeWidth="5" strokeLinecap="round" fill="none" />
      <circle cx="90" cy="55" r="3" stroke="#1ba081" strokeWidth="4" fill="white" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon className="w-12 h-12 shrink-0" />
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-bold tracking-tight text-[#0a4d40]">
            VitalSense
          </span>
          <span className="text-[26px] font-bold tracking-tight text-[#1c2b3e]">
            AI
          </span>
        </div>
        <span className="text-[13px] font-medium tracking-wide text-[#5f6a74] -mt-1">
          AI-Powered Sepsis Monitoring
        </span>
      </div>
    </div>
  )
}
