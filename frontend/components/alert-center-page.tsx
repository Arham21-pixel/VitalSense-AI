"use client"

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Download,
  Filter,
  Search,
  ShieldAlert,
  ShieldCheck,
  Siren,
  TriangleAlert,
  User2,
  Zap,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { getAlerts, dismissAlert, type AlertRecord } from '@/lib/api'

type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low'
type AlertStatus = 'Unassigned' | 'Assigned' | 'In Progress' | 'Resolved'
type TabKey = 'Active Alerts' | 'Alert History'

const summaryCards = [
  { label: 'Critical Alerts', icon: Siren, tone: 'critical' },
  { label: 'High Alerts', icon: TriangleAlert, tone: 'high' },
  { label: 'Medium Alerts', icon: Bell, tone: 'medium' },
  { label: 'Low Alerts', icon: ShieldCheck, tone: 'low' },
  { label: 'Avg. Response Time', icon: Zap, tone: 'neutral' },
] as const

const tabs: TabKey[] = ['Active Alerts', 'Alert History']

const severityStyles: Record<string, string> = {
  critical: 'border-rose-200 bg-rose-50 text-rose-600',
  high: 'border-orange-200 bg-orange-50 text-orange-600',
  medium: 'border-amber-200 bg-amber-50 text-amber-600',
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  neutral: 'border-blue-200 bg-blue-50 text-blue-600',
}

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
    <article className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
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
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
      <Bell className="mx-auto h-5 w-5 text-slate-400" />
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  )
}

export function AlertCenterPage() {
  const [tab, setTab] = useState<TabKey>('Active Alerts')
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadAlerts = async () => {
      try {
        setLoading(true)
        const allAlerts = await getAlerts(true)
        if (!active) return
        setAlerts(allAlerts)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Unable to load alerts')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadAlerts()

    return () => {
      active = false
    }
  }, [])

  const activeAlerts = alerts.filter((alert) => !alert.dismissed)
  const historyAlerts = alerts.filter((alert) => alert.dismissed)
  const filteredAlerts = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase()
    const source = tab === 'Active Alerts' ? activeAlerts : historyAlerts
    if (!lowerQuery) return source

    return source.filter((alert) => {
      return (
        alert.alert_id.toLowerCase().includes(lowerQuery) ||
        alert.patient_id.toLowerCase().includes(lowerQuery) ||
        alert.priority.toLowerCase().includes(lowerQuery) ||
        alert.message.toLowerCase().includes(lowerQuery)
      )
    })
  }, [activeAlerts, historyAlerts, query, tab])

  const summaryValues = {
    critical: activeAlerts.filter((alert) => alert.priority === 'CRITICAL').length,
    high: activeAlerts.filter((alert) => alert.priority === 'HIGH').length,
    medium: activeAlerts.filter((alert) => alert.priority === 'WARNING').length,
    low: activeAlerts.filter((alert) => alert.priority === 'NORMAL').length,
    avgResponse: activeAlerts.length > 0 ? Math.max(3, Math.round(45 / activeAlerts.length)) : 0,
  }

  const onDismissAlert = async (alertId: string) => {
    try {
      await dismissAlert(alertId)
      setAlerts((current) => current.map((alert) => (alert.alert_id === alertId ? { ...alert, dismissed: true } : alert)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to dismiss alert')
    }
  }

  const activeCount = activeAlerts.length
  const historyCount = historyAlerts.length
  const [severity] = useState<'All Severity' | AlertSeverity>('All Severity')
  const [status] = useState<'All Status' | AlertStatus>('All Status')
  const [ward] = useState('All Wards')
  const [assignee] = useState('All Assigned To')

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffffff_0%,#f7fafc_35%,#eef4f9_100%)] text-slate-900">
      <div className="mx-auto max-w-[1680px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/70 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.05)] backdrop-blur">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <div>
                <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900 sm:text-[2.4rem]">
                  Alert Center
                </h1>
                <p className="mt-2 text-sm text-slate-500 sm:text-[0.95rem]">
                  No sample alert records are bundled with this screen.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <User2 className="h-4 w-4" />
                All Wards
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <CalendarDays className="h-4 w-4" />
                Connect live data to see timestamps
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => {
            const Icon = card.icon
            return (
              <article key={card.label} className="rounded-[1.25rem] border border-slate-200/80 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
                <div className="flex items-start gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', severityStyles[card.tone])}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">0</p>
                    <p className="mt-1 text-xs text-slate-500">Awaiting a live feed</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <SectionCard
              title="Filters"
              subtitle="The controls remain, but there is no bundled sample alert data."
              action={<Filter className="h-4 w-4 text-slate-400" />}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-600 shadow-sm">
                  Severity
                </button>
                <button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-600 shadow-sm">
                  Status
                </button>
                <button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-600 shadow-sm">
                  Ward
                </button>
                <button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-600 shadow-sm">
                  Assigned To
                </button>
              </div>

              <label className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Search alerts..."
                />
              </label>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{severity}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{status}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{ward}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{assignee}</span>
              </div>
            </SectionCard>

            <SectionCard
              title="Alert Trend"
              subtitle="This chart will render once live alert data is connected."
              action={<ShieldAlert className="h-4 w-4 text-slate-400" />}
            >
              <EmptyState
                title="No alert history yet"
                description="The dashboard is ready to plot counts by severity when records are available."
              />
            </SectionCard>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-1 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
              <div className="flex flex-wrap gap-2 p-2">
                {tabs.map((item) => {
                  const active = tab === item
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTab(item)}
                      className={cn(
                        'rounded-xl px-4 py-2 text-sm font-medium transition',
                        active ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
                      )}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>

            <SectionCard
              title={tab}
              subtitle={tab === 'Active Alerts' ? 'No active alerts are loaded.' : 'No historical alerts are loaded.'}
              action={<span className="text-xs text-slate-400">0 records</span>}
            >
              <EmptyState
                title={tab === 'Active Alerts' ? 'No active alerts' : 'No history records'}
                description={
                  tab === 'Active Alerts'
                    ? 'Connect a backend feed to populate the triage queue.'
                    : 'Historical events will appear here once archived records are available.'
                }
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <button type="button" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Assign
                </button>
                <button type="button" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Escalate
                </button>
                <button type="button" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Resolve
                </button>
              </div>
            </SectionCard>

            <SectionCard
              title="Live Queue"
              subtitle="Patient-specific alert rows have been removed."
              action={<span className="text-xs text-slate-400">0 open</span>}
            >
              <EmptyState
                title="Queue is empty"
                description="Once live data is wired in, the alert table can be restored without hardcoded records."
              />
            </SectionCard>
          </div>
        </div>
      </div>
    </main>
  )
}
