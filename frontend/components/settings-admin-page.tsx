'use client'

import { useState, type ComponentType, type ReactNode } from 'react'
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Clock3,
  Globe,
  LayoutGrid,
  Languages,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  SquarePen,
  UserRound,
  Users,
  Siren,
} from 'lucide-react'

import { PrimaryNavigation } from '@/components/primary-navigation'
import { cn } from '@/lib/utils'

type TabKey = 'User Roles' | 'Hospital Settings' | 'Alert Thresholds' | 'Notification Rules'

const tabs: TabKey[] = ['User Roles', 'Hospital Settings', 'Alert Thresholds', 'Notification Rules']
const hospitalFields = [
  { label: 'Hospital Name', value: 'Not configured', icon: LayoutGrid },
  { label: 'Timezone', value: 'Not configured', icon: Globe },
  { label: 'Date Format', value: 'Not configured', icon: CalendarDays },
  { label: 'Time Format', value: 'Not configured', icon: Clock3 },
  { label: 'Language', value: 'Not configured', icon: Languages },
  { label: 'Default Unit System', value: 'Not configured', icon: SlidersHorizontal },
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
  icon: Icon,
}: {
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
      <Icon className="mx-auto h-5 w-5 text-slate-400" />
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  )
}

export function SettingsAdminPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('User Roles')

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffffff_0%,#f6f8fc_38%,#edf3f9_100%)] text-slate-900">
      <div className="mx-auto max-w-[1680px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/75 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.05)] backdrop-blur">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900 sm:text-[2.4rem]">
                Settings & Administration
              </h1>
              <p className="mt-2 text-sm text-slate-500 sm:text-[0.95rem]">
                All bundled sample users and configuration values have been removed.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <LayoutGrid className="h-4 w-4" />
                Hospital Settings
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <CalendarDays className="h-4 w-4" />
                Connect live config to show timestamps
              </button>
              <button
                type="button"
                className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                  0
                </span>
              </button>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f8f63_0%,#16b57b_100%)] text-white shadow-sm">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Administration</p>
                  <p className="text-xs text-slate-500">No sample profile loaded</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

        </div>

        <div className="mt-5 border-b border-slate-200">
          <div className="-mb-px flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const active = activeTab === tab
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'border-b-2 px-3 py-3 text-sm font-medium transition',
                    active
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
                  )}
                >
                  {tab}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.95fr_1fr]">
          <div className="space-y-4">
            <SectionCard
              title="User Roles"
              subtitle="No sample users are bundled in this screen."
              action={<Users className="h-4 w-4 text-slate-400" />}
            >
              <EmptyState
                title="User list is empty"
                description="Add real accounts through your backend when you are ready."
                icon={Users}
              />
            </SectionCard>

            <SectionCard
              title="Role Search"
              subtitle="Search is available once records exist."
              action={<Search className="h-4 w-4 text-slate-400" />}
            >
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Search users..."
                  readOnly
                />
              </label>
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-sm text-slate-500">
                No sample rows are available to filter.
              </div>
            </SectionCard>
          </div>

          <div className="space-y-4">
            <SectionCard
              title="Hospital Settings"
              subtitle="Configuration fields are blank until connected to a real source."
              action={<SquarePen className="h-4 w-4 text-slate-400" />}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {hospitalFields.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title={activeTab}
              subtitle="This panel is intentionally empty until you connect live data."
              action={<span className="text-xs text-slate-400">No records</span>}
            >
              <EmptyState
                title="Nothing to display"
                description="Tabs, alerts, and notification rules can be repopulated from your own source of truth."
                icon={activeTab === 'Notification Rules' ? Siren : activeTab === 'Alert Thresholds' ? ShieldAlert : ShieldCheck}
              />
            </SectionCard>
          </div>

          <div className="space-y-4">
            <SectionCard
              title="Alert Thresholds"
              subtitle="Threshold tables have been cleared of sample ranges."
              action={<ShieldAlert className="h-4 w-4 text-slate-400" />}
            >
              <EmptyState
                title="No thresholds configured"
                description="Add your own thresholds after wiring the admin backend."
                icon={ShieldAlert}
              />
            </SectionCard>

            <SectionCard
              title="Notification Rules"
              subtitle="No sample routing rules are included."
              action={<Siren className="h-4 w-4 text-slate-400" />}
            >
              <EmptyState
                title="No notification rules"
                description="Notification channels and escalation policies can be added later."
                icon={Siren}
              />
            </SectionCard>
          </div>
        </div>
      </div>
    </main>
  )
}
