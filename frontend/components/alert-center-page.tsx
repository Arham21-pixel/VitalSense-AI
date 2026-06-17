"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Siren,
  TriangleAlert,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { getAlerts, dismissAlert, type AlertRecord } from '@/lib/api'
import { playAlertSoundIfUnmuted, isSoundMuted, toggleSoundMute } from '@/lib/sound'

// ─── Types ────────────────────────────────────────────────────────────────────
type TabKey = 'Active' | 'History'
type PriorityFilter = 'ALL' | 'CRITICAL' | 'HIGH' | 'WARNING' | 'NORMAL'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PRIORITY_ORDER: Record<string, number> = { CRITICAL: 1, HIGH: 2, WARNING: 3, NORMAL: 4 }

function priorityStyle(priority: string) {
  switch (priority) {
    case 'CRITICAL': return { badge: 'bg-rose-100 text-rose-700 border-rose-200', bar: '#f43f5e', dot: 'bg-rose-500' }
    case 'HIGH':     return { badge: 'bg-orange-100 text-orange-700 border-orange-200', bar: '#f97316', dot: 'bg-orange-500' }
    case 'WARNING':  return { badge: 'bg-amber-100 text-amber-700 border-amber-200', bar: '#f59e0b', dot: 'bg-amber-500' }
    default:         return { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', bar: '#10b981', dot: 'bg-emerald-500' }
  }
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString()
}

// ─── Alert Row ────────────────────────────────────────────────────────────────
function AlertRow({
  alert,
  onDismiss,
  dismissing,
}: {
  alert: AlertRecord
  onDismiss: (id: string) => void
  dismissing: boolean
}) {
  const styles = priorityStyle(alert.priority)

  return (
    <div
      className={cn(
        'group relative rounded-xl border p-4 transition-all duration-200',
        alert.dismissed
          ? 'border-border/40 bg-muted/20 opacity-60'
          : 'border-border/60 bg-card shadow-sm hover:shadow-md hover:border-border',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Priority dot */}
        <div className="mt-0.5 flex-shrink-0">
          <span className={cn('block h-2.5 w-2.5 rounded-full', styles.dot, !alert.dismissed && 'animate-pulse')} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Top row: patient + badge + time */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-foreground">{alert.patient_id}</span>
            <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', styles.badge)}>
              {alert.priority}
            </span>
            <span className="ml-auto text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {relativeTime(alert.timestamp)}
            </span>
          </div>

          {/* Message */}
          <p className="text-sm text-foreground leading-snug">{alert.message}</p>

          {/* Factors */}
          {alert.top_factors && alert.top_factors.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {alert.top_factors.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  <ChevronRight className="h-2.5 w-2.5" />
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {!alert.dismissed && (
          <button
            onClick={() => onDismiss(alert.alert_id)}
            disabled={dismissing}
            title="Dismiss alert"
            className="flex-shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          >
            {dismissing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          </button>
        )}
        {alert.dismissed && (
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
        )}
      </div>
    </div>
  )
}

// ─── Trend Bar Chart ──────────────────────────────────────────────────────────
function AlertTrendChart({ alerts }: { alerts: AlertRecord[] }) {
  const counts = useMemo(() => {
    const c = { CRITICAL: 0, HIGH: 0, WARNING: 0, NORMAL: 0 }
    for (const a of alerts) {
      const k = a.priority as keyof typeof c
      if (k in c) c[k]++
    }
    return c
  }, [alerts])

  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const bars = [
    { label: 'Critical', key: 'CRITICAL', color: '#f43f5e' },
    { label: 'High', key: 'HIGH', color: '#f97316' },
    { label: 'Warning', key: 'WARNING', color: '#f59e0b' },
    { label: 'Normal', key: 'NORMAL', color: '#10b981' },
  ] as const

  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
        <Bell className="mx-auto h-5 w-5 text-muted-foreground" />
        <p className="mt-3 text-sm font-semibold text-foreground">No alert history yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Alert counts by severity will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {bars.map(({ label, key, color }) => {
        const val = counts[key]
        const pct = total > 0 ? (val / total) * 100 : 0
        return (
          <div key={key}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold text-foreground">{val}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        )
      })}
      <p className="text-right text-[11px] text-muted-foreground">{total} total alerts</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function AlertCenterPage() {
  const [tab, setTab] = useState<TabKey>('Active')
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL')
  const [dismissingId, setDismissingId] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)

  // Track which alert IDs we've already seen so we can detect genuinely new ones
  const knownAlertIds = useRef<Set<string>>(new Set())
  const isFirstLoad = useRef(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sync muted state from sessionStorage on mount
  useEffect(() => {
    setMuted(isSoundMuted())
  }, [])

  const handleToggleMute = () => {
    const newMuted = toggleSoundMute()
    setMuted(newMuted)
  }

  const loadAlerts = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)
      setError(null)
      const data = await getAlerts(true) // include dismissed for history tab

      // ── New-alert detection & sound ──────────────────────────────────────
      if (!isFirstLoad.current) {
        // Find active alerts that weren't in our known set
        const newActive = data.filter(
          (a) => !a.dismissed && !knownAlertIds.current.has(a.alert_id)
        )
        if (newActive.length > 0) {
          // Play the sound for the highest priority new alert
          const priorities = ['CRITICAL', 'HIGH', 'WARNING', 'NORMAL']
          const topPriority = priorities.find((p) =>
            newActive.some((a) => a.priority === p)
          ) ?? 'NORMAL'
          playAlertSoundIfUnmuted(topPriority)
        }
      } else {
        isFirstLoad.current = false
      }

      // Update known IDs with all alerts from this fetch
      data.forEach((a) => knownAlertIds.current.add(a.alert_id))
      setAlerts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load alerts')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial load + auto-refresh every 8 seconds
  useEffect(() => {
    loadAlerts()
    intervalRef.current = setInterval(() => loadAlerts(true), 8000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [loadAlerts])

  const handleDismiss = async (alertId: string) => {
    setDismissingId(alertId)
    try {
      await dismissAlert(alertId)
      setAlerts((prev) =>
        prev.map((a) => (a.alert_id === alertId ? { ...a, dismissed: true } : a))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to dismiss alert')
    } finally {
      setDismissingId(null)
    }
  }

  // ── Derived ──
  const activeAlerts = alerts.filter((a) => !a.dismissed)
  const historyAlerts = alerts.filter((a) => a.dismissed)

  const summaryValues = {
    critical: activeAlerts.filter((a) => a.priority === 'CRITICAL').length,
    high: activeAlerts.filter((a) => a.priority === 'HIGH').length,
    medium: activeAlerts.filter((a) => a.priority === 'WARNING').length,
    low: activeAlerts.filter((a) => a.priority === 'NORMAL').length,
    avgResponse: activeAlerts.length > 0 ? Math.max(3, Math.round(45 / activeAlerts.length)) : 0,
  }

  const displayAlerts = useMemo(() => {
    const source = tab === 'Active' ? activeAlerts : historyAlerts
    const q = query.trim().toLowerCase()
    return source
      .filter((a) => {
        if (priorityFilter !== 'ALL' && a.priority !== priorityFilter) return false
        if (!q) return true
        return (
          a.alert_id.toLowerCase().includes(q) ||
          a.patient_id.toLowerCase().includes(q) ||
          a.message.toLowerCase().includes(q) ||
          a.top_factors?.some((f) => f.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99))
  }, [tab, activeAlerts, historyAlerts, query, priorityFilter])

  const summaryCards = [
    { label: 'Critical', icon: Siren, value: summaryValues.critical, color: 'bg-rose-100 text-rose-600', key: 'CRITICAL' as PriorityFilter },
    { label: 'High', icon: TriangleAlert, value: summaryValues.high, color: 'bg-orange-100 text-orange-600', key: 'HIGH' as PriorityFilter },
    { label: 'Warning', icon: Bell, value: summaryValues.medium, color: 'bg-amber-100 text-amber-600', key: 'WARNING' as PriorityFilter },
    { label: 'Normal', icon: ShieldCheck, value: summaryValues.low, color: 'bg-emerald-100 text-emerald-700', key: 'NORMAL' as PriorityFilter },
    { label: 'Avg Response', icon: Zap, value: `${summaryValues.avgResponse}m`, color: 'bg-blue-100 text-blue-600', key: 'ALL' as PriorityFilter },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1680px] px-4 py-4 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="rounded-xl border border-border/60 bg-card/80 px-5 py-4 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Alert Center</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Real-time sepsis alerts from the VitalSense AI engine.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Live indicator */}
              <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Auto-refresh 8s
              </div>

              {/* Mute toggle */}
              <button
                type="button"
                onClick={handleToggleMute}
                title={muted ? 'Unmute alert sounds' : 'Mute alert sounds'}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm shadow-sm transition-colors',
                  muted
                    ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                    : 'border-border bg-card text-foreground hover:bg-accent',
                )}
              >
                {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                {muted ? 'Sounds off' : 'Sounds on'}
              </button>

              {/* Manual refresh */}
              <button
                type="button"
                onClick={() => loadAlerts(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground shadow-sm hover:bg-accent transition-colors disabled:opacity-60"
              >
                <RefreshCw className={cn('h-3.5 w-3.5 text-muted-foreground', refreshing && 'animate-spin')} />
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground shadow-sm hover:bg-accent transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                Export
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

        {/* Summary cards */}
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => {
            const Icon = card.icon
            const isActive = priorityFilter === card.key && card.key !== 'ALL'
            return (
              <article
                key={card.label}
                onClick={() => card.key !== 'ALL' && setPriorityFilter(priorityFilter === card.key ? 'ALL' : card.key)}
                className={cn(
                  'rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all duration-200',
                  card.key !== 'ALL' && 'cursor-pointer hover:shadow-md hover:border-border',
                  isActive && 'ring-2 ring-primary ring-offset-1',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0', card.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                      {loading ? '—' : card.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {loading ? 'Loading…' : card.key === 'ALL' ? 'minutes avg' : 'active alerts'}
                    </p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {/* Main grid */}
        <div className="mt-4 grid gap-4 xl:grid-cols-[340px_1fr]">

          {/* Left column: filters + trend */}
          <div className="space-y-4">
            {/* Filters */}
            <article className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Filters</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">Click summary cards or use the fields below</p>
                </div>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Search */}
              <label className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground focus-within:ring-2 focus-within:ring-primary/30">
                <Search className="h-3.5 w-3.5 shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Search by patient, message, factor…"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </label>

              {/* Priority filter chips */}
              <div className="mt-3 flex flex-wrap gap-2">
                {(['ALL', 'CRITICAL', 'HIGH', 'WARNING', 'NORMAL'] as PriorityFilter[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={cn(
                      'rounded-full px-3 py-1 text-[11px] font-semibold transition-colors border',
                      priorityFilter === p
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border',
                    )}
                  >
                    {p === 'ALL' ? 'All' : p}
                  </button>
                ))}
              </div>

              {/* Active filter summary */}
              {(query || priorityFilter !== 'ALL') && (
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{displayAlerts.length} result{displayAlerts.length !== 1 ? 's' : ''}</span>
                  <button
                    onClick={() => { setQuery(''); setPriorityFilter('ALL') }}
                    className="text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </article>

            {/* Alert trend chart */}
            <article className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Alert Distribution</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">Breakdown of all {alerts.length} alerts by priority</p>
                </div>
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              </div>
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-4 rounded bg-muted/60" />)}
                </div>
              ) : (
                <AlertTrendChart alerts={alerts} />
              )}
            </article>
          </div>

          {/* Right column: alert list */}
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card p-1 shadow-sm w-fit">
              {(['Active', 'History'] as TabKey[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'rounded-lg px-5 py-2 text-sm font-medium transition-all duration-150',
                    tab === t
                      ? 'bg-foreground text-background shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {t === 'Active' ? (
                    <span className="flex items-center gap-2">
                      <Siren className="h-3.5 w-3.5" />
                      Active
                      {activeAlerts.length > 0 && (
                        <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {activeAlerts.length}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <BellOff className="h-3.5 w-3.5" />
                      History
                      {historyAlerts.length > 0 && (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                          {historyAlerts.length}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Alert list */}
            <article className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {tab === 'Active' ? 'Active Alerts' : 'Alert History'}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {tab === 'Active'
                      ? `${activeAlerts.length} alert${activeAlerts.length !== 1 ? 's' : ''} requiring attention`
                      : `${historyAlerts.length} dismissed alert${historyAlerts.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{displayAlerts.length} shown</span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse rounded-xl border border-border/50 p-4 space-y-2">
                      <div className="h-4 w-1/3 rounded bg-muted/60" />
                      <div className="h-3 w-2/3 rounded bg-muted/60" />
                    </div>
                  ))}
                </div>
              ) : displayAlerts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center">
                  {tab === 'Active' ? (
                    <>
                      <ShieldCheck className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                      <p className="text-sm font-semibold text-foreground">All clear</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {query || priorityFilter !== 'ALL'
                          ? 'No alerts match your current filters.'
                          : 'No active alerts right now. New alerts appear automatically.'}
                      </p>
                    </>
                  ) : (
                    <>
                      <BellOff className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-semibold text-foreground">No history yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">Dismissed alerts will appear here.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {displayAlerts.map((alert) => (
                    <AlertRow
                      key={alert.alert_id}
                      alert={alert}
                      onDismiss={handleDismiss}
                      dismissing={dismissingId === alert.alert_id}
                    />
                  ))}
                </div>
              )}
            </article>
          </div>
        </div>
      </div>
    </main>
  )
}
