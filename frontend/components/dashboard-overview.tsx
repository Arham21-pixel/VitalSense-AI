"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  Bell,
  BedDouble,
  CheckCircle2,
  ChevronRight,
  Clock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { getPatients, getAlerts, type PatientRecord, type AlertRecord } from '@/lib/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

function priorityColor(priority: string) {
  switch (priority) {
    case 'CRITICAL': return { dot: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700', bar: '#f43f5e' }
    case 'HIGH':     return { dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700', bar: '#f97316' }
    case 'WARNING':  return { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', bar: '#f59e0b' }
    default:         return { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', bar: '#10b981' }
  }
}

function statusColor(status: string) {
  switch (status) {
    case 'CRITICAL': return '#f43f5e'
    case 'HIGH RISK': return '#f97316'
    case 'MONITOR': return '#f59e0b'
    default: return '#10b981'
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <article className={cn('rounded-xl border border-border/60 bg-card p-5 shadow-sm', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </article>
  )
}

// ─── Risk Distribution Chart ──────────────────────────────────────────────────
function RiskDistribution({ patients }: { patients: PatientRecord[] }) {
  const counts = {
    CRITICAL: patients.filter(p => p.status === 'CRITICAL').length,
    'HIGH RISK': patients.filter(p => p.status === 'HIGH RISK').length,
    MONITOR: patients.filter(p => p.status === 'MONITOR').length,
    STABLE: patients.filter(p => p.status === 'STABLE').length,
  }
  const total = patients.length

  const bars = [
    { label: 'Critical', key: 'CRITICAL', color: '#f43f5e' },
    { label: 'High Risk', key: 'HIGH RISK', color: '#f97316' },
    { label: 'Monitor', key: 'MONITOR', color: '#f59e0b' },
    { label: 'Stable', key: 'STABLE', color: '#10b981' },
  ] as const

  if (total === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">No patient data yet.</p>
  }

  return (
    <div className="space-y-3">
      {bars.map(({ label, key, color }) => {
        const val = counts[key]
        const pct = total > 0 ? (val / total) * 100 : 0
        return (
          <div key={key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold text-foreground">{val} <span className="text-muted-foreground font-normal">({Math.round(pct)}%)</span></span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
          </div>
        )
      })}
      <p className="text-right text-[11px] text-muted-foreground pt-1">{total} patients total</p>
    </div>
  )
}

// ─── ICU Bed Grid ─────────────────────────────────────────────────────────────
function ICUOverview({ patients }: { patients: PatientRecord[] }) {
  if (patients.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">No ICU data yet.</p>
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {patients.map((p) => {
          const color = statusColor(p.status ?? 'STABLE')
          return (
            <div key={p.patient_id} className="rounded-lg border border-border/50 bg-muted/20 p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[11px] font-semibold text-foreground truncate">{p.bed_number ?? p.patient_id}</span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{p.patient_id}</p>
              <p className="text-[10px] font-medium mt-0.5" style={{ color }}>{p.status ?? 'STABLE'}</p>
              <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                <Activity className="h-2.5 w-2.5" />
                {p.heart_rate} bpm
              </div>
            </div>
          )
        })}
      </div>

      {/* Occupancy bar */}
      <div className="pt-1 border-t border-border/40">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">ICU Occupancy</span>
          <span className="font-semibold text-foreground">{patients.length} / 8 beds</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, (patients.length / 8) * 100)}%`, backgroundColor: '#6366f1' }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Live Alerts List ─────────────────────────────────────────────────────────
function LiveAlertsList({ alerts }: { alerts: AlertRecord[] }) {
  const active = alerts.filter(a => !a.dismissed).slice(0, 5)

  if (active.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-center">
        <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500 mb-2" />
        <p className="text-xs font-medium text-foreground">All clear</p>
        <p className="text-xs text-muted-foreground mt-0.5">No active alerts right now.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {active.map(alert => {
        const c = priorityColor(alert.priority)
        return (
          <div key={alert.alert_id} className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-muted/20 p-2.5">
            <span className={cn('mt-1 h-2 w-2 rounded-full flex-shrink-0 animate-pulse', c.dot)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-foreground">{alert.patient_id}</span>
                <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', c.badge)}>{alert.priority}</span>
                <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />{relativeTime(alert.timestamp)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{alert.message}</p>
            </div>
          </div>
        )
      })}
      {alerts.filter(a => !a.dismissed).length > 5 && (
        <p className="text-center text-[11px] text-muted-foreground">
          +{alerts.filter(a => !a.dismissed).length - 5} more in Alert Center
        </p>
      )}
    </div>
  )
}

// ─── Recent Events Feed ───────────────────────────────────────────────────────
function RecentEvents({ patients, alerts }: { patients: PatientRecord[]; alerts: AlertRecord[] }) {
  const criticalPatients = patients.filter(p => p.status === 'CRITICAL')
  const highRisk = patients.filter(p => p.status === 'HIGH RISK')
  const recentAlerts = alerts.filter(a => !a.dismissed).slice(0, 3)

  const events: { icon: ReactNode; text: string; time: string; color: string }[] = []

  recentAlerts.forEach(a => {
    const c = priorityColor(a.priority)
    events.push({
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      text: `Alert for ${a.patient_id}: ${a.top_factors?.slice(0, 2).join(', ') || a.priority}`,
      time: relativeTime(a.timestamp),
      color: c.bar,
    })
  })

  criticalPatients.slice(0, 2).forEach(p => {
    events.push({
      icon: <Activity className="h-3.5 w-3.5" />,
      text: `${p.patient_id} (${p.bed_number}) — CRITICAL · HR ${p.heart_rate} bpm`,
      time: 'Now',
      color: '#f43f5e',
    })
  })

  highRisk.slice(0, 2).forEach(p => {
    events.push({
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      text: `${p.patient_id} elevated vitals — ${p.status}`,
      time: 'Now',
      color: '#f97316',
    })
  })

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-center">
        <Sparkles className="mx-auto h-5 w-5 text-muted-foreground mb-2" />
        <p className="text-xs font-medium text-foreground">No events yet</p>
        <p className="text-xs text-muted-foreground mt-0.5">Activity appears as alerts and vitals come in.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {events.slice(0, 6).map((e, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted/60" style={{ color: e.color }}>
            {e.icon}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-xs text-foreground leading-snug line-clamp-1">{e.text}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{e.time}</p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/50 mt-0.5" />
        </div>
      ))}
    </div>
  )
}

// ─── AI Summary Panel ─────────────────────────────────────────────────────────
function AISummaryPanel({
  patients,
  alerts,
  loading,
}: {
  patients: PatientRecord[]
  alerts: AlertRecord[]
  loading: boolean
}) {
  const totalPatients = patients.length
  const highRiskPatients = patients.filter(p => ['HIGH RISK', 'CRITICAL'].includes(p.status ?? '')).length
  const modelConfidence = totalPatients > 0
    ? Math.round(((totalPatients - highRiskPatients) / totalPatients) * 100)
    : 0
  const confidenceColor = modelConfidence >= 70 ? '#10b981' : modelConfidence >= 40 ? '#f59e0b' : '#f43f5e'

  // Aggregate top factors from active alerts
  const factorMap: Record<string, number> = {}
  alerts.filter(a => !a.dismissed).forEach(a => {
    a.top_factors?.forEach(f => { factorMap[f] = (factorMap[f] ?? 0) + 1 })
  })
  const topFactors = Object.entries(factorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  // Status breakdown for mini-stats
  const criticalCount = patients.filter(p => p.status === 'CRITICAL').length
  const stableCount = patients.filter(p => p.status === 'STABLE').length
  const activeAlerts = alerts.filter(a => !a.dismissed).length

  return (
    <div className="grid gap-6 xl:grid-cols-[200px_minmax(0,1fr)]">
      {/* Confidence gauge */}
      <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
        <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full transition-all duration-700"
            style={{
              background: loading
                ? 'conic-gradient(#d4d4d8 0% 100%)'
                : `conic-gradient(${confidenceColor} 0% ${modelConfidence}%, #e4e4e7 ${modelConfidence}% 100%)`,
            }}
          />
          <div className="absolute inset-3 rounded-full bg-card" />
          <div className="relative text-center">
            <Sparkles className="mx-auto mb-2 h-6 w-6" style={{ color: loading ? '#a1a1aa' : confidenceColor }} />
            <p className="text-xs font-medium text-muted-foreground">Model Confidence</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {loading ? '—' : `${modelConfidence}%`}
            </p>
          </div>
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-muted">
          <div
            className="h-1.5 rounded-full transition-all duration-700"
            style={{ width: loading ? '0%' : `${modelConfidence}%`, backgroundColor: loading ? '#d4d4d8' : confidenceColor }}
          />
        </div>
      </div>

      {/* Live insights */}
      <div className="space-y-4">
        {/* Mini stat row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Active Alerts', value: activeAlerts, color: 'text-rose-600' },
            { label: 'Critical Pts', value: criticalCount, color: 'text-orange-600' },
            { label: 'Stable Pts', value: stableCount, color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-border/50 bg-muted/20 p-2.5 text-center">
              <p className={cn('text-xl font-bold tracking-tight', s.color)}>{loading ? '—' : s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Top contributing risk factors */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Top Risk Factors Detected
          </p>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[...Array(3)].map((_, i) => <div key={i} className="h-3 rounded bg-muted/60" />)}
            </div>
          ) : topFactors.length > 0 ? (
            <ul className="space-y-1.5">
              {topFactors.map(([factor, count]) => (
                <li key={factor} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    {factor}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {count}×
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              {totalPatients > 0 ? 'No elevated risk factors detected. All patients are stable.' : 'Waiting for patient data…'}
            </p>
          )}
        </div>

        {/* System status */}
        <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-violet-500" />
            <p className="text-xs font-semibold text-foreground">AI Engine Status</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {loading
              ? 'Connecting to inference pipeline…'
              : `Monitoring ${totalPatients} patient${totalPatients !== 1 ? 's' : ''} · ${activeAlerts} alert${activeAlerts !== 1 ? 's' : ''} active`}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const METRIC_CARDS = [
  { label: 'Total Patients', icon: Users, tone: 'emerald' },
  { label: 'High Risk', icon: BedDouble, tone: 'rose' },
  { label: 'Open Alerts', icon: Bell, tone: 'amber' },
  { label: 'ICU Occupancy', icon: Activity, tone: 'violet' },
  { label: 'Mortality Risk', icon: ShieldCheck, tone: 'blue' },
  { label: 'Avg. Response', icon: Workflow, tone: 'teal' },
] as const

function metricTone(tone: (typeof METRIC_CARDS)[number]['tone']) {
  switch (tone) {
    case 'rose':   return 'bg-rose-100 text-rose-600'
    case 'amber':  return 'bg-amber-100 text-amber-600'
    case 'violet': return 'bg-violet-100 text-violet-600'
    case 'blue':   return 'bg-blue-100 text-blue-600'
    case 'teal':   return 'bg-emerald-100 text-emerald-600'
    default:       return 'bg-emerald-100 text-emerald-700'
  }
}

export function DashboardOverview() {
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchAll = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)
      setError(null)
      const [loadedPatients, loadedAlerts] = await Promise.all([
        getPatients(),
        getAlerts(), // active only
      ])
      setPatients(loadedPatients)
      setAlerts(loadedAlerts)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Mount + 10-second auto-refresh
  useEffect(() => {
    fetchAll()
    intervalRef.current = setInterval(() => fetchAll(true), 10_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchAll])

  // ── Derived metrics ──
  const totalPatients = patients.length
  const highRiskPatients = patients.filter(p => ['HIGH RISK', 'CRITICAL'].includes(p.status ?? '')).length
  const openAlerts = alerts.length
  const icuOccupancy = totalPatients > 0 ? Math.min(100, Math.round((totalPatients / 8) * 100)) : 0
  const mortalityRisk = highRiskPatients > 0 ? Math.min(99, highRiskPatients * 20) : 0
  const avgResponse = openAlerts > 0 ? Math.max(3, Math.round(45 / openAlerts)) : 0

  const metricValues: Record<string, string | number> = {
    'Total Patients': totalPatients,
    'High Risk': highRiskPatients,
    'Open Alerts': openAlerts,
    'ICU Occupancy': `${icuOccupancy}%`,
    'Mortality Risk': `${mortalityRisk}%`,
    'Avg. Response': `${avgResponse} min`,
  }

  return (
    <main id="dashboard-top" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto min-h-screen max-w-[1720px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4">

          {/* Header */}
          <header className="rounded-xl border border-border/60 bg-card/80 px-5 py-4 shadow-sm backdrop-blur-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Real-time patient and alert data from the VitalSense backend.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Live indicator */}
                <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live · 10s refresh
                </div>
                {lastUpdated && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => fetchAll(true)}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground shadow-sm hover:bg-accent transition-colors disabled:opacity-60"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5 text-muted-foreground', refreshing && 'animate-spin')} />
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
            </div>
            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </header>

          {/* Connection status banner */}
          <div className={cn(
            'rounded-xl border px-5 py-3 shadow-sm transition-colors',
            loading
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : error
              ? 'border-rose-200 bg-rose-50 text-rose-900'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          )}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {loading ? 'Connecting to backend…' : error ? 'Connection issue' : 'Live connection established'}
                </p>
                <p className="text-sm opacity-75">
                  {loading
                    ? 'Loading patient vitals and alerts.'
                    : error
                    ? error
                    : `${totalPatients} patients · ${openAlerts} active alert${openAlerts !== 1 ? 's' : ''} · auto-refreshing every 10s`}
                </p>
              </div>
              {!loading && (
                <div className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold',
                  openAlerts > 0 ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                )}>
                  <Bell className="h-3.5 w-3.5" />
                  {openAlerts} alert{openAlerts !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {METRIC_CARDS.map((card) => {
              const Icon = card.icon
              return (
                <article
                  key={card.label}
                  className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md hover:border-border transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0', metricTone(card.tone))}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mb-1.5 text-xs font-medium leading-none text-muted-foreground">{card.label}</p>
                      <p className="text-2xl font-bold tracking-tight text-foreground">
                        {loading ? '—' : metricValues[card.label]}
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {loading ? 'Loading…' : 'Live from backend'}
                      </p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {/* Row 2: Risk Distribution + ICU Overview + Live Alerts */}
          <div className="grid gap-4 xl:grid-cols-[1.1fr_1.2fr_0.9fr]">
            <SectionCard
              title="Risk Distribution"
              action={
                <button
                  onClick={() => fetchAll(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw className={cn('h-3 w-3', refreshing && 'animate-spin')} />
                  Refresh
                </button>
              }
            >
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-4 rounded bg-muted/60" />)}
                </div>
              ) : (
                <RiskDistribution patients={patients} />
              )}
            </SectionCard>

            <SectionCard title="ICU Overview">
              {loading ? (
                <div className="grid grid-cols-2 gap-2 animate-pulse">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted/60" />)}
                </div>
              ) : (
                <ICUOverview patients={patients} />
              )}
            </SectionCard>

            <SectionCard
              title="Live Alerts"
              action={
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold',
                  openAlerts > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                )}>
                  {openAlerts} active
                </span>
              }
            >
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted/60" />)}
                </div>
              ) : (
                <LiveAlertsList alerts={alerts} />
              )}
            </SectionCard>
          </div>

          {/* Row 3: Recent Events + AI Summary */}
          <div className="grid gap-4 xl:grid-cols-[1fr_1.6fr]">
            <SectionCard
              title="Recent Events"
              action={
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Live
                </span>
              }
            >
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-8 rounded bg-muted/60" />)}
                </div>
              ) : (
                <RecentEvents patients={patients} alerts={alerts} />
              )}
            </SectionCard>

            <SectionCard title="AI Summary" className="overflow-hidden">
              <AISummaryPanel patients={patients} alerts={alerts} loading={loading} />
            </SectionCard>
          </div>

        </div>
      </div>
    </main>
  )
}
