'use client';

import { useEffect, useState } from 'react';

export default function RiskGauge({ value = 0 }) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPercent(value * 100);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  let strokeColor = '#10B981';
  if (percent >= 70) {
    strokeColor = '#DC2626';
  } else if (percent >= 40) {
    strokeColor = '#F59E0B';
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      width: '140px',
      height: '140px'
    }}>
      <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="transparent"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.8s ease'
          }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <span style={{
          fontSize: '1.75rem',
          fontWeight: '800',
          color: 'var(--hb-text-main)',
          lineHeight: 1
        }}>
          {Math.round(percent)}%
        </span>
        <span style={{
          fontSize: '0.625rem',
          color: 'var(--hb-text-muted)',
          textTransform: 'uppercase',
          fontWeight: 'bold',
          letterSpacing: '0.05em',
          marginTop: '4px'
        }}>
          Risk Score
        </span>
      </div>
    </div>
  );
}

