"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  HeartPulse,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  Users,
  Zap,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  getPatients,
  runPrediction,
  type PatientRecord,
  type PredictionResult,
  createPredictionWebSocket,
} from '@/lib/api'

// ─── Summary cards ────────────────────────────────────────────────────────────
const summaryCards = [
  { label: 'Total Patients', icon: Users, tone: 'emerald' },
  { label: 'High Risk', icon: ShieldAlert, tone: 'orange' },
  { label: 'Critical', icon: TriangleAlert, tone: 'rose' },
  { label: 'Stable', icon: HeartPulse, tone: 'green' },
] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStatusBadge(status: string | undefined) {
  switch (status) {
    case 'CRITICAL': return 'bg-rose-100 text-rose-700'
    case 'HIGH RISK': return 'bg-orange-100 text-orange-700'
    case 'MONITOR': return 'bg-amber-100 text-amber-700'
    case 'STABLE': return 'bg-emerald-100 text-emerald-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function getRiskColor(level: string) {
  switch (level) {
    case 'CRITICAL': return { bg: '#f43f5e', light: '#fff1f2', text: 'text-rose-700', border: 'border-rose-200' }
    case 'HIGH': return { bg: '#f97316', light: '#fff7ed', text: 'text-orange-700', border: 'border-orange-200' }
    case 'MEDIUM': return { bg: '#f59e0b', light: '#fffbeb', text: 'text-amber-700', border: 'border-amber-200' }
    default: return { bg: '#10b981', light: '#ecfdf5', text: 'text-emerald-700', border: 'border-emerald-200' }
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <article className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </article>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
      <HeartPulse className="mx-auto h-5 w-5 text-muted-foreground" />
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

// ─── AI Prediction Panel ──────────────────────────────────────────────────────
function AIPredictionPanel({
  patient,
  prediction,
  predicting,
  predictionError,
  onRunPrediction,
}: {
  patient: PatientRecord
  prediction: PredictionResult | null
  predicting: boolean
  predictionError: string | null
  onRunPrediction: () => void
}) {
  const riskColors = prediction ? getRiskColor(prediction.risk_level) : getRiskColor('LOW')
  const riskPct = prediction ? Math.round(prediction.risk_score * 100) : 0

  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-500" />
          <p className="text-xs font-semibold text-foreground">AI Prediction</p>
          {prediction && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <button
          onClick={onRunPrediction}
          disabled={predicting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium text-foreground shadow-sm hover:bg-accent transition-colors disabled:opacity-60"
        >
          {predicting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Zap className="h-3 w-3 text-violet-500" />
          )}
          {predicting ? 'Analysing…' : 'Run'}
        </button>
      </div>

      {/* Error */}
      {predictionError && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {predictionError}
        </div>
      )}

      {/* Loading skeleton */}
      {predicting && !prediction && (
        <div className="space-y-3 animate-pulse">
          <div className="h-24 rounded-xl bg-muted/60" />
          <div className="h-4 w-3/4 rounded bg-muted/60" />
          <div className="h-4 w-1/2 rounded bg-muted/60" />
        </div>
      )}

      {/* Results */}
      {prediction && (
        <>
          {/* Risk gauge */}
          <div
            className={cn('rounded-xl border p-3', riskColors.border)}
            style={{ backgroundColor: riskColors.light }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={cn('text-xs font-semibold', riskColors.text)}>
                {prediction.risk_level} RISK
              </span>
              <span className={cn('text-xl font-bold tracking-tight', riskColors.text)}>
                {riskPct}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-2 w-full rounded-full bg-white/60">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${riskPct}%`, backgroundColor: riskColors.bg }}
              />
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px]" style={{ color: riskColors.bg }}>
              {prediction.alert ? (
                <>
                  <AlertTriangle className="h-3 w-3" />
                  Alert triggered · Priority: {prediction.priority}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  No alert · {prediction.priority}
                </>
              )}
            </div>
          </div>

          {/* Top factors */}
          {prediction.top_factors.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Top Factors
              </p>
              <ul className="space-y-1.5">
                {prediction.top_factors.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-foreground">
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Model scores */}
          {prediction.scores && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Model Scores
              </p>
              <div className="space-y-2">
                {Object.entries(prediction.scores).map(([model, score]) => {
                  const pct = Math.round((score as number) * 100)
                  return (
                    <div key={model}>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="capitalize text-muted-foreground">{model}</span>
                        <span className="font-semibold text-foreground">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: riskColors.bg }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {prediction.model_version}
            </span>
            <span>{new Date(prediction.timestamp).toLocaleTimeString()}</span>
          </div>
        </>
      )}

      {/* No prediction yet and not loading */}
      {!prediction && !predicting && !predictionError && (
        <div className="text-center py-4">
          <Brain className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-xs font-medium text-foreground">Ready to analyse</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click <strong>Run</strong> to get an instant AI prediction for this patient.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Selected Report ──────────────────────────────────────────────────────────
function SelectedReport({
  patient,
  prediction,
  predicting,
  predictionError,
  onRunPrediction,
}: {
  patient: PatientRecord | null
  prediction: PredictionResult | null
  predicting: boolean
  predictionError: string | null
  onRunPrediction: () => void
}) {
  if (!patient) {
    return (
      <EmptyState
        title="No patient selected"
        description="Click a patient row to view live report data."
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {patient.patient_id} — {patient.bed_number ?? 'Bed N/A'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Status: {patient.status ?? 'Unknown'}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div className="flex items-center gap-1 justify-end">
              <Activity className="h-3 w-3 text-emerald-500" />
              <span>Live</span>
            </div>
            <div className="mt-1 text-foreground">
              {prediction ? new Date(prediction.timestamp).toLocaleTimeString() : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Vitals + AI side by side */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Vitals */}
        <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5">
          <p className="text-xs font-semibold text-foreground mb-2">Vitals</p>
          <ul className="text-sm text-foreground space-y-1.5">
            <li className="flex justify-between">
              <span className="text-muted-foreground">Heart rate</span>
              <span className="font-medium">{patient.heart_rate} bpm</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Temperature</span>
              <span className="font-medium">{patient.temperature} °C</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Resp. rate</span>
              <span className="font-medium">{patient.respiratory_rate} /min</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">SpO2</span>
              <span className="font-medium">{patient.spo2}%</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Systolic BP</span>
              <span className="font-medium">{patient.systolic_bp} mmHg</span>
            </li>
            <li className="flex justify-between pt-1 border-t border-border/40">
              <span className="text-muted-foreground">WBC</span>
              <span className="font-medium">{patient.wbc}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Lactate</span>
              <span className="font-medium">{patient.lactate}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Creatinine</span>
              <span className="font-medium">{patient.creatinine}</span>
            </li>
          </ul>
        </div>

        {/* AI Prediction */}
        <AIPredictionPanel
          patient={patient}
          prediction={prediction}
          predicting={predicting}
          predictionError={predictionError}
          onRunPrediction={onRunPrediction}
        />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function PatientMonitoringPage() {
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [livePredictions, setLivePredictions] = useState<Record<string, PredictionResult>>({})
  const [predicting, setPredicting] = useState(false)
  const [predictionError, setPredictionError] = useState<string | null>(null)

  // Keep a ref to the latest patients list so the prediction callback can read it
  const patientsRef = useRef(patients)
  useEffect(() => { patientsRef.current = patients }, [patients])

  // ── Fetch patients on mount ──
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setError(null)
        const loaded = await getPatients()
        if (mounted) setPatients(loaded)
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load patient data')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // ── WebSocket live prediction updates ──
  useEffect(() => {
    let socket: WebSocket | null = null
    try {
      socket = createPredictionWebSocket((payload) => {
        const items = Array.isArray(payload) ? payload : [payload]
        setLivePredictions((prev) => {
          const next = { ...prev }
          for (const p of items) {
            if (p && typeof p === 'object' && 'patient_id' in p) {
              next[(p as PredictionResult).patient_id] = p as PredictionResult
            }
          }
          return next
        })
      })
    } catch {
      // ignore WebSocket init errors (e.g. no WS server yet)
    }
    return () => {
      try { socket?.close() } catch {}
    }
  }, [])

  // ── On-demand prediction ──
  const fetchPrediction = useCallback(async (patientId: string) => {
    const patient = patientsRef.current.find((p) => p.patient_id === patientId)
    if (!patient) return
    setPredicting(true)
    setPredictionError(null)
    try {
      const result = await runPrediction(patient)
      setLivePredictions((prev) => ({ ...prev, [patientId]: result }))
    } catch (err) {
      setPredictionError(err instanceof Error ? err.message : 'Prediction failed')
    } finally {
      setPredicting(false)
    }
  }, [])

  // Trigger prediction immediately when a patient is selected
  const handleSelectPatient = useCallback((patientId: string) => {
    setSelectedPatientId(patientId)
    setPredictionError(null)
    // Only auto-run if we don't already have a fresh prediction
    fetchPrediction(patientId)
  }, [fetchPrediction])

  // ── Derived values ──
  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return patients
    return patients.filter((p) =>
      p.patient_id.toLowerCase().includes(q) ||
      p.status?.toLowerCase().includes(q) ||
      p.bed_number?.toLowerCase().includes(q)
    )
  }, [patients, query])

  const totalPatients = patients.length
  const highRiskCount = patients.filter((p) => ['HIGH RISK', 'CRITICAL'].includes(p.status ?? '')).length
  const criticalCount = patients.filter((p) => p.status === 'CRITICAL').length
  const stableCount = patients.filter((p) => p.status === 'STABLE').length

  const selectedPatient = patients.find((p) => p.patient_id === selectedPatientId) ?? null
  const selectedPrediction = selectedPatientId ? (livePredictions[selectedPatientId] ?? null) : null

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto min-h-screen max-w-[1700px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[calc(100vh-2rem)] gap-4">
          <section className="min-w-0">
            {/* Header */}
            <header className="rounded-xl border border-border/60 bg-card/80 px-5 py-4 shadow-sm backdrop-blur-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Patient Monitoring
                  </h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Real-time patient vitals powered by the backend API.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground shadow-sm hover:bg-accent transition-colors"
                  >
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    Connect data to show dates
                  </button>
                  <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live updates
                  </div>
                </div>
              </div>
            </header>

            {/* Summary cards */}
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((stat) => {
                const Icon = stat.icon
                const value =
                  stat.label === 'Total Patients' ? totalPatients :
                  stat.label === 'High Risk' ? highRiskCount :
                  stat.label === 'Critical' ? criticalCount :
                  stableCount

                return (
                  <article key={stat.label} className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0',
                        stat.tone === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                        stat.tone === 'orange' ? 'bg-orange-100 text-orange-600' :
                        stat.tone === 'rose' ? 'bg-rose-100 text-rose-600' :
                        'bg-emerald-100 text-emerald-700'
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                        <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{loading ? 'Loading…' : 'Current status'}</p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Main content grid */}
            <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              {/* Patient list */}
              <SectionCard
                title="Patient List"
                subtitle="Live patient data from the backend service."
                action={<span className="text-xs text-muted-foreground">{filteredPatients.length} patients</span>}
              >
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  <Search className="h-3.5 w-3.5 shrink-0" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by ID, ward, or status"
                    className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-border/50">
                  <table className="min-w-full divide-y divide-border text-left text-sm text-foreground">
                    <thead className="bg-muted/30 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Patient</th>
                        <th className="px-4 py-3">Heart Rate</th>
                        <th className="px-4 py-3">Bed</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                            <Loader2 className="mx-auto h-5 w-5 animate-spin mb-2" />
                            Loading patients…
                          </td>
                        </tr>
                      ) : filteredPatients.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                            {error ?? 'No patient records available.'}
                          </td>
                        </tr>
                      ) : (
                        filteredPatients.map((patient) => (
                          <tr
                            key={patient.patient_id}
                            className={cn(
                              'border-b border-border/80 hover:bg-accent/50 cursor-pointer transition-colors',
                              selectedPatientId === patient.patient_id ? 'bg-primary/10' : ''
                            )}
                            onClick={() => handleSelectPatient(patient.patient_id)}
                          >
                            <td className="px-4 py-4 font-medium text-foreground">{patient.patient_id}</td>
                            <td className="px-4 py-4 text-muted-foreground">{patient.heart_rate} bpm</td>
                            <td className="px-4 py-4 text-muted-foreground">{patient.bed_number ?? 'N/A'}</td>
                            <td className="px-4 py-4">
                              <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', getStatusBadge(patient.status))}>
                                {patient.status ?? 'Unknown'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              {/* Selected report */}
              <SectionCard
                title="Selected Report"
                subtitle="Live vitals and AI prediction for the selected patient."
                action={
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{selectedPatientId ?? 'No selection'}</span>
                    {selectedPatientId && (
                      <button
                        onClick={() => { setSelectedPatientId(null); setPredictionError(null) }}
                        className="text-xs text-foreground/80 hover:text-foreground"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                }
              >
                {filteredPatients.length === 0 ? (
                  <EmptyState
                    title="No data available"
                    description="Patient details will populate once a backend connection is active."
                  />
                ) : selectedPatientId == null ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5">
                      <p className="text-xs font-semibold text-foreground">Vitals overview</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Select a patient row to load live vitals and run an instant AI prediction.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {['Vitals', 'AI Prediction', 'Timeline', 'Notes'].map((label) => (
                        <div key={label} className="rounded-xl border border-border/50 bg-muted/20 p-3.5">
                          <p className="text-xs font-semibold text-foreground">{label}</p>
                          <p className="mt-1 text-xs text-muted-foreground">No selection yet.</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <SelectedReport
                    patient={selectedPatient}
                    prediction={selectedPrediction}
                    predicting={predicting}
                    predictionError={predictionError}
                    onRunPrediction={() => selectedPatientId && fetchPrediction(selectedPatientId)}
                  />
                )}
              </SectionCard>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
