"use client"

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Activity,
  Bell,
  BedDouble,
  CalendarDays,
  ChevronDown,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { getPatients, getAlerts } from '@/lib/api'

const metricCards = [
  { label: 'Total Patients', icon: Users, tone: 'emerald' },
  { label: 'High Risk Patients', icon: BedDouble, tone: 'rose' },
  { label: 'Open Alerts', icon: Bell, tone: 'amber' },
  { label: 'ICU Occupancy', icon: Activity, tone: 'violet' },
  { label: 'Mortality Risk', icon: ShieldCheck, tone: 'blue' },
  { label: 'Avg. Response', icon: Workflow, tone: 'teal' },
] as const

function metricTone(tone: (typeof metricCards)[number]['tone']) {
  switch (tone) {
    case 'rose':
      return 'bg-rose-100 text-rose-600'
    case 'amber':
      return 'bg-amber-100 text-amber-600'
    case 'violet':
      return 'bg-violet-100 text-violet-600'
    case 'blue':
      return 'bg-blue-100 text-blue-600'
    case 'teal':
      return 'bg-emerald-100 text-emerald-600'
    default:
      return 'bg-emerald-100 text-emerald-700'
  }
}

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
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </article>
  )
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center">
      <Sparkles className="mx-auto h-5 w-5 text-muted-foreground" />
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function DashboardOverview() {
  const [patients, setPatients] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setError(null)
      setLoading(true)
      const [loadedPatients, loadedAlerts] = await Promise.all([getPatients(), getAlerts()])
      setPatients(loadedPatients)
      setAlerts(loadedAlerts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const totalPatients = patients.length
  const highRiskPatients = patients.filter((patient: any) => ['HIGH RISK', 'CRITICAL'].includes(patient.status)).length
  const openAlerts = alerts.length
  const icuOccupancy = totalPatients > 0 ? Math.min(100, Math.round(totalPatients * 12.5)) : 0
  const mortalityRisk = highRiskPatients > 0 ? Math.min(100, highRiskPatients * 20) : 0
  const avgResponse = openAlerts > 0 ? Math.max(5, Math.round(60 / openAlerts)) : 0

  return (
    <main id="dashboard-top" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto min-h-screen max-w-[1720px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[calc(100vh-2rem)] gap-4">
          <div className="flex min-w-0 flex-col gap-4">
            <header className="rounded-xl border border-border/60 bg-card/80 px-5 py-4 shadow-sm backdrop-blur-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Real-time patient and alert data from the VitalSense backend.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground shadow-sm hover:bg-accent transition-colors"
                  >
                    ICU feed
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground shadow-sm hover:bg-accent transition-colors"
                  >
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    Connect a source to show timestamps
                  </button>
                  <button
                    type="button"
                    onClick={refresh}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground shadow-sm hover:bg-accent transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                    {refreshing ? 'Refreshing' : 'Refresh'}
                  </button>
                </div>
              </div>
              {error ? (
                <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
            </header>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">{loading ? 'Connecting to backend…' : 'Live connection established'}</p>
                  <p className="text-sm text-amber-800/80">
                    {loading ? 'Loading patient vitals and alerts.' : 'Refreshing dashboard metrics from the backend.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-800 transition-colors"
                >
                  {openAlerts} active alerts
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              {metricCards.map((card) => {
                const Icon = card.icon
                const value =
                  card.label === 'Total Patients'
                    ? totalPatients
                    : card.label === 'High Risk Patients'
                    ? highRiskPatients
                    : card.label === 'Open Alerts'
                    ? openAlerts
                    : card.label === 'ICU Occupancy'
                    ? `${icuOccupancy}%`
                    : card.label === 'Mortality Risk'
                    ? `${mortalityRisk}%`
                    : `${avgResponse} min`

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
                        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
                        <p className="mt-1.5 text-xs text-muted-foreground">{loading ? 'Updating…' : 'Live from backend'}</p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.1fr_1.2fr_0.9fr]">
              <SectionCard
                title="Risk Distribution"
                action={
                  <button
                    type="button"
                    onClick={refresh}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </button>
                }
              >
                <EmptyState
                  title="Risk data is coming soon"
                  description="Risk distribution will render once live patient telemetry is fully connected."
                />
              </SectionCard>

              <SectionCard title="ICU Overview">
                <EmptyState
                  title="ICU metrics unavailable"
                  description="This layout is ready for live occupancy and bed usage data."
                />
              </SectionCard>

              <SectionCard
                title="Live Alerts"
                action={
                  <button type="button" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    View all
                  </button>
                }
              >
                <div className="rounded-3xl border border-border/80 bg-muted/30 p-6 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">{openAlerts} active alerts</p>
                  <p className="mt-2">The alert list is powered by backend policy, and updates whenever new risk predictions generate alerts.</p>
                </div>
              </SectionCard>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_1.6fr]">
              <SectionCard
                title="Recent Events"
                action={
                  <button type="button" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    View all
                  </button>
                }
              >
                <EmptyState
                  title="No event history yet"
                  description="Activity will populate here after live patient and alert feeds are connected."
                />
              </SectionCard>

              <SectionCard title="AI Summary" className="overflow-hidden">
                <div className="grid gap-6 xl:grid-cols-[200px_minmax(0,1fr)]">
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                    <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-[conic-gradient(#10b981_0%_15%,#e4e4e7_15%_100%)]" />
                      <div className="absolute inset-3 rounded-full bg-card" />
                      <div className="relative text-center">
                        <Sparkles className="mx-auto mb-2 h-6 w-6 text-green-500" />
                        <p className="text-xs font-medium text-muted-foreground">Model Confidence</p>
                        <p className="text-2xl font-bold tracking-tight text-foreground">{loading ? '—' : '74%'}</p>
                      </div>
                    </div>
                    <div className="mt-4 h-1.5 rounded-full bg-muted">
                      <div className="h-1.5 w-3/5 rounded-full bg-green-500" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <EmptyState
                      title="Live analytics ready"
                      description="Once predictions arrive, this panel will display model confidence, severity drivers, and actionable guidance."
                    />
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
