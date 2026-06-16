"use client"

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  CalendarDays,
  ChevronDown,
  HeartPulse,
  Search,
  ShieldAlert,
  TriangleAlert,
  Users,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { getPatients, type PatientRecord } from '@/lib/api'

const summaryCards = [
  { label: 'Total Patients', icon: Users, tone: 'emerald' },
  { label: 'High Risk', icon: ShieldAlert, tone: 'orange' },
  { label: 'Critical', icon: TriangleAlert, tone: 'rose' },
  { label: 'Stable', icon: HeartPulse, tone: 'green' },
] as const

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

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
      <HeartPulse className="mx-auto h-5 w-5 text-muted-foreground" />
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function getStatusBadge(status: string | undefined) {
  switch (status) {
    case 'CRITICAL':
      return 'bg-rose-100 text-rose-700'
    case 'HIGH RISK':
      return 'bg-orange-100 text-orange-700'
    case 'MONITOR':
      return 'bg-amber-100 text-amber-700'
    case 'STABLE':
      return 'bg-emerald-100 text-emerald-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export function PatientMonitoringPage() {
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let mounted = true
    const loadData = async () => {
      try {
        setError(null)
        const loaded = await getPatients()
        if (mounted) {
          setPatients(loaded)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to load patient data')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [])

  const filteredPatients = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return patients

    return patients.filter((patient) => {
      return (
        patient.patient_id.toLowerCase().includes(normalized) ||
        patient.status?.toLowerCase().includes(normalized) ||
        patient.bed_number?.toLowerCase().includes(normalized)
      )
    })
  }, [patients, query])

  const totalPatients = patients.length
  const highRiskCount = patients.filter((patient) => ['HIGH RISK', 'CRITICAL'].includes(patient.status ?? '')).length
  const criticalCount = patients.filter((patient) => patient.status === 'CRITICAL').length
  const stableCount = patients.filter((patient) => patient.status === 'STABLE').length

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto min-h-screen max-w-[1700px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[calc(100vh-2rem)] gap-4">
          <section className="min-w-0">
            <header className="rounded-xl border border-border/60 bg-card/80 px-5 py-4 shadow-sm backdrop-blur-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Patient Monitoring</h1>
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
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground shadow-sm hover:bg-accent transition-colors"
                  >
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    Search for patients
                  </button>
                  <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live updates ready
                  </div>
                </div>
              </div>
            </header>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((stat) => {
                const Icon = stat.icon
                const value =
                  stat.label === 'Total Patients'
                    ? totalPatients
                    : stat.label === 'High Risk'
                    ? highRiskCount
                    : stat.label === 'Critical'
                    ? criticalCount
                    : stableCount

                return (
                  <article key={stat.label} className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0',
                          stat.tone === 'emerald'
                            ? 'bg-emerald-100 text-emerald-700'
                            : stat.tone === 'orange'
                              ? 'bg-orange-100 text-orange-600'
                              : stat.tone === 'rose'
                                ? 'bg-rose-100 text-rose-600'
                                : 'bg-emerald-100 text-emerald-700',
                        )}
                      >
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

            <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <SectionCard
                title="Patient List"
                subtitle="Live patient data from the backend service."
                action={<span className="text-xs text-muted-foreground">{filteredPatients.length} patients</span>}
              >
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  <Search className="h-3.5 w-3.5 shrink-0" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by ID, ward, or status"
                    className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-border/50">
                  <table className="min-w-full divide-y divide-border text-left text-sm text-foreground">
                    <thead className="bg-muted/30 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Patient</th>
                        <th className="px-4 py-3">Risk</th>
                        <th className="px-4 py-3">Bed</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                            Loading patients…
                          </td>
                        </tr>
                      ) : filteredPatients.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                            {error ? error : 'No patient records available.'}
                          </td>
                        </tr>
                      ) : (
                        filteredPatients.map((patient) => (
                          <tr key={patient.patient_id} className="border-b border-border/80">
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

              <SectionCard
                title="Selected Report"
                subtitle="A patient report panel will appear here when a row is selected."
                action={<span className="text-xs text-muted-foreground">No selection</span>}
              >
                {filteredPatients.length === 0 ? (
                  <EmptyState
                    title="No data available"
                    description="Patient details will populate once a backend connection is active."
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5">
                      <p className="text-xs font-semibold text-foreground">Vitals overview</p>
                      <p className="mt-1 text-xs text-muted-foreground">Select a patient to review live vital signs and alerts.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {['Vitals', 'Labs', 'Timeline', 'Notes'].map((label) => (
                        <div key={label} className="rounded-xl border border-border/50 bg-muted/20 p-3.5">
                          <p className="text-xs font-semibold text-foreground">{label}</p>
                          <p className="mt-1 text-xs text-muted-foreground">No selection yet.</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
