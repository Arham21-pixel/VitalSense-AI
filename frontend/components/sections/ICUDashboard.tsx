'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ScrollReveal } from '../shared/ScrollReveal'
import { GradientText } from '../shared/GradientText'
import { Activity, AlertCircle, TrendingUp, Users } from 'lucide-react'
import { getPatients, getAlerts, createPredictionWebSocket, type PatientRecord, type PredictionResult } from '@/lib/api'

const riskBubbleStyles: Record<string, string> = {
  CRITICAL: 'bg-rose-500 text-white',
  'HIGH RISK': 'bg-orange-500 text-white',
  MONITOR: 'bg-amber-500 text-white',
  STABLE: 'bg-emerald-500 text-white',
}

function buildVitals(data: PatientRecord | null) {
  return [
    { label: 'Heart Rate', value: data ? `${Math.round(data.heart_rate)}` : '—', unit: 'bpm', color: data && data.heart_rate > 100 ? 'text-red-400' : 'text-foreground' },
    { label: 'SpO₂', value: data ? `${Math.round(data.spo2)}` : '—', unit: '%', color: data && data.spo2 < 94 ? 'text-orange-400' : 'text-foreground' },
    { label: 'Lactate', value: data ? `${data.lactate.toFixed(1)}` : '—', unit: 'mmol/L', color: data && data.lactate > 2 ? 'text-red-400' : 'text-foreground' },
  ]
}

export function ICUDashboard() {
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [predictions, setPredictions] = useState<PredictionResult[]>([])
  const [alertCount, setAlertCount] = useState(0)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const loadInitialData = async () => {
      try {
        setLoading(true)
        const patientData = await getPatients()
        const alertData = await getAlerts()
        if (mounted) {
          setPatients(patientData)
          setAlertCount(alertData.length)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadInitialData()

    const socket = createPredictionWebSocket(
      (message) => {
        if (!mounted) return
        if (Array.isArray(message)) {
          setPredictions(message as PredictionResult[])
          setAlertCount((message as PredictionResult[]).filter((prediction) => prediction.alert).length)
        }
      },
      () => setConnected(true),
      () => setConnected(false),
      () => setConnected(false),
    )

    return () => {
      mounted = false
      socket.close()
    }
  }, [])

  const latestPrediction = useMemo(() => {
    if (predictions.length === 0) return null
    return predictions.reduce((best, prediction) => {
      if (!best || prediction.risk_score > best.risk_score) return prediction
      return best
    }, predictions[0] as PredictionResult)
  }, [predictions])

  const topPatient = useMemo(() => {
    return patients.find((patient) => patient.patient_id === latestPrediction?.patient_id) ?? null
  }, [patients, latestPrediction])

  const riskScore = latestPrediction?.risk_score ?? 0
  const displayRisk = Math.round(riskScore * 100)
  const riskLevel = latestPrediction?.risk_level ?? 'STABLE'
  const trendValues = predictions.slice(-7).map((prediction) => Math.round(prediction.risk_score * 100))
  const vitals = buildVitals(topPatient)

  return (
    <section className="relative py-24 bg-background overflow-hidden border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4 text-balance">
            VitalSense <GradientText>Command Center</GradientText>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Real-time patient monitoring and clinical decision support at your fingertips.
          </p>
        </ScrollReveal>

        {/* Dashboard */}
        <ScrollReveal delay={0.2}>
          <motion.div
            whileHover={{ y: -2 }}
            className="relative rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Glow effect */}
            <div className="absolute -inset-px bg-gradient-to-r from-primary via-blue-500 to-green-500 rounded-2xl opacity-20 blur-xl pointer-events-none" />

            <div className="relative bg-secondary rounded-2xl p-8 md:p-12">
              {/* Dashboard header */}
              <div className="flex items-center justify-between mb-8 pb-8 border-b border-foreground/10">
                <div>
                  <p className="text-xs text-muted-foreground font-medium tracking-widest mb-1">PATIENT ID</p>
                  <p className="text-3xl font-bold text-secondary-foreground tracking-tight">P001</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Refresh Rate</p>
                    <p className="text-xl font-bold text-green-400">15s</p>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                </div>
              </div>

              {/* Main content grid */}
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Left column - Risk score and vitals */}
                <div className="lg:col-span-1">
                  {/* Risk gauge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                  >
                    <p className="text-xs text-muted-foreground font-medium tracking-widest mb-4">SEPSIS RISK</p>
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                        <motion.circle
                          cx="60" cy="60" r="50" fill="none"
                          stroke="url(#riskGradient)"
                          strokeWidth="8"
                          strokeDasharray={314}
                          initial={{ strokeDashoffset: 314 }}
                          whileInView={{ strokeDashoffset: 314 * 0.06 }}
                          transition={{ delay: 0.5, duration: 1.5 }}
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fca5a5" />
                            <stop offset="100%" stopColor="#dc2626" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-secondary-foreground tracking-tighter">94</p>
                          <p className="text-xs text-muted-foreground">%</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-xs text-red-400 font-semibold tracking-widest">HIGH RISK</p>
                  </motion.div>

                  {/* Key vitals */}
                  <div className="space-y-2.5">
                    <p className="text-xs text-muted-foreground font-medium tracking-widest mb-3">KEY VITALS</p>
                    {[
                      { label: 'Heart Rate', value: '124', unit: 'bpm', color: 'text-red-400' },
                      { label: 'SpO₂', value: '89', unit: '%', color: 'text-orange-400' },
                      { label: 'Lactate', value: '4.4', unit: 'mmol/L', color: 'text-red-400' },
                    ].map((vital) => (
                      <motion.div
                        key={vital.label}
                        initial={{ opacity: 0, x: -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between bg-white/5 rounded-xl p-3.5 border border-white/8"
                      >
                        <span className="text-sm text-muted-foreground">{vital.label}</span>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${vital.color} tracking-tight`}>{vital.value}</p>
                          <p className="text-xs text-muted-foreground/60">{vital.unit}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Middle column - Trend chart */}
                <div className="lg:col-span-1">
                  <p className="text-xs text-muted-foreground font-medium tracking-widest mb-4">RISK TREND</p>
                  <motion.div
                    className="h-52 bg-gradient-to-t from-primary/15 to-transparent rounded-xl p-4 border border-white/8 flex items-end justify-around gap-1.5"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {[35, 42, 58, 73, 82, 88, 94].map((height, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-primary to-blue-400 rounded-t-sm opacity-80"
                        style={{ height: `${height}%` }}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${height}%` }}
                        transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                      />
                    ))}
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">Last 7 hours</p>
                </div>

                {/* Right column - Alerts */}
                <div className="lg:col-span-1">
                  <p className="text-xs text-muted-foreground font-medium tracking-widest mb-4">ACTIVE ALERTS</p>
                  <div className="space-y-2.5 max-h-52 overflow-y-auto">
                    {[
                      { icon: AlertCircle, text: 'Lactate elevation detected', color: 'text-red-400', bg: 'bg-red-400/8', border: 'border-red-400/15' },
                      { icon: Activity, text: 'Tachycardia trend ongoing', color: 'text-orange-400', bg: 'bg-orange-400/8', border: 'border-orange-400/15' },
                      { icon: TrendingUp, text: 'Sepsis probability increasing', color: 'text-yellow-400', bg: 'bg-yellow-400/8', border: 'border-yellow-400/15' },
                      { icon: Users, text: 'Physician notification sent', color: 'text-green-400', bg: 'bg-green-400/8', border: 'border-green-400/15' },
                    ].map((alert, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border ${alert.bg} ${alert.border}`}
                      >
                        <alert.icon className={`${alert.color} flex-shrink-0 mt-0.5 w-4 h-4`} />
                        <span className="text-sm text-muted-foreground">{alert.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  )
}
