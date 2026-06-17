'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  SquarePen,
  UserRound,
  Users,
} from 'lucide-react'

import {
  getSettings,
  resetSettings,
  saveSettings,
  type HospitalSettings,
  type NotificationSettings,
  type RoleSettings,
  type SettingsDraft,
  type SettingsSnapshot,
  type ThresholdSettings,
} from '@/lib/api'
import { cn } from '@/lib/utils'

type TabKey = 'Hospital Settings' | 'Alert Thresholds' | 'Notification Rules' | 'User Roles'

const tabs: TabKey[] = ['Hospital Settings', 'Alert Thresholds', 'Notification Rules', 'User Roles']

const DEFAULT_SETTINGS: SettingsDraft = {
  hospital: {
    hospital_name: 'VitalSense General Hospital',
    timezone: 'Asia/Kolkata',
    date_format: 'DD MMM YYYY',
    time_format: '24-hour',
    language: 'English',
    default_unit_system: 'Metric',
  },
  thresholds: {
    lactate_warning: 2.0,
    lactate_critical: 3.5,
    heart_rate_high: 100,
    respiratory_rate_high: 22,
    spo2_low: 92,
    temperature_high: 38.3,
    systolic_bp_low: 90,
  },
  notifications: {
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    escalation_minutes: 10,
    on_call_team: 'Rapid Response Team',
    quiet_hours_start: '22:00',
    quiet_hours_end: '06:00',
  },
  roles: [
    {
      id: 'role-admin',
      name: 'Administrator',
      access_level: 'Admin',
      members: 2,
      active: true,
      scope: 'Full control over hospital settings, roles, thresholds, and alerts.',
    },
    {
      id: 'role-lead',
      name: 'Clinical Lead',
      access_level: 'Editor',
      members: 4,
      active: true,
      scope: 'Can tune thresholds, review alerts, and coordinate escalation policy.',
    },
    {
      id: 'role-nurse',
      name: 'Nurse Station',
      access_level: 'Responder',
      members: 12,
      active: true,
      scope: 'Can review patient context, acknowledge alerts, and update handoff notes.',
    },
    {
      id: 'role-viewer',
      name: 'Ward Viewer',
      access_level: 'Read Only',
      members: 8,
      active: false,
      scope: 'View live status and audit history without editing policy.',
    },
  ],
}

const ACCESS_LEVELS = ['Admin', 'Editor', 'Responder', 'Read Only'] as const

function cloneSettings(settings: SettingsDraft | SettingsSnapshot): SettingsDraft {
  return {
    hospital: { ...settings.hospital },
    thresholds: { ...settings.thresholds },
    notifications: { ...settings.notifications },
    roles: settings.roles.map((role) => ({ ...role })),
  }
}

function formatTimestamp(value: string | null) {
  if (!value) return 'Waiting for backend sync'
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
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

function Label({
  children,
  hint,
}: {
  children: ReactNode
  hint?: ReactNode
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <label className="text-sm font-medium text-slate-700">{children}</label>
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  step = '1',
  min,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  step?: string
  min?: number
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="number"
        value={Number.isNaN(value) ? '' : value}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        min={min}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

function TogglePill({
  label,
  enabled,
  onToggle,
  description,
}: {
  label: string
  enabled: boolean
  onToggle: () => void
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className={cn(
        'flex w-full items-start justify-between gap-4 rounded-2xl border p-4 text-left transition',
        enabled
          ? 'border-emerald-200 bg-emerald-50/80 shadow-sm'
          : 'border-slate-200 bg-white shadow-sm hover:bg-slate-50',
      )}
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      <span
        className={cn(
          'mt-0.5 inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold',
          enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600',
        )}
      >
        {enabled ? 'On' : 'Off'}
      </span>
    </button>
  )
}

function RoleCard({
  role,
  onNameChange,
  onAccessLevelChange,
  onMembersChange,
  onScopeChange,
  onToggleActive,
}: {
  role: RoleSettings
  onNameChange: (value: string) => void
  onAccessLevelChange: (value: string) => void
  onMembersChange: (value: number) => void
  onScopeChange: (value: string) => void
  onToggleActive: () => void
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 shadow-sm transition',
        role.active ? 'border-slate-200 bg-white' : 'border-slate-200/70 bg-slate-50/80 opacity-90',
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <TextField label="Role name" value={role.name} onChange={onNameChange} />
          <p className="mt-2 text-xs text-slate-400">{role.id}</p>
        </div>
        <button
          type="button"
          onClick={onToggleActive}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
            role.active
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
          )}
        >
          <span className={cn('h-2 w-2 rounded-full', role.active ? 'bg-emerald-500' : 'bg-slate-400')} />
          {role.active ? 'Active' : 'Disabled'}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <SelectField
          label="Access level"
          value={role.access_level}
          onChange={onAccessLevelChange}
          options={[...ACCESS_LEVELS]}
        />
        <NumberField label="Members" value={role.members} onChange={onMembersChange} min={0} />
      </div>

      <div className="mt-3">
        <Label>Scope</Label>
        <textarea
          value={role.scope}
          onChange={(event) => onScopeChange(event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
      </div>
    </div>
  )
}

export function SettingsAdminPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('Hospital Settings')
  const [draft, setDraft] = useState<SettingsDraft>(cloneSettings(DEFAULT_SETTINGS))
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [roleSearch, setRoleSearch] = useState('')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)

  const dirtyRef = useRef(isDirty)
  useEffect(() => {
    dirtyRef.current = isDirty
  }, [isDirty])

  const loadSettings = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      setError(null)
      const snapshot = await getSettings()
      setDraft(cloneSettings(snapshot))
      setLastSyncedAt(snapshot.updated_at)
      setIsDirty(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load settings')
      if (!silent) {
        setDraft(cloneSettings(DEFAULT_SETTINGS))
        setLastSyncedAt(null)
        setIsDirty(false)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  useEffect(() => {
    const timer = setInterval(() => {
      if (!dirtyRef.current) {
        void loadSettings(true)
      }
    }, 30000)

    return () => clearInterval(timer)
  }, [loadSettings])

  const hospitalSummary = draft.hospital.hospital_name
  const activeRoles = draft.roles.filter((role) => role.active).length
  const enabledChannels = [
    draft.notifications.email_enabled,
    draft.notifications.sms_enabled,
    draft.notifications.push_enabled,
  ].filter(Boolean).length

  const updateHospital = <K extends keyof HospitalSettings>(key: K, value: HospitalSettings[K]) => {
    setDraft((current) =>
      ({
        ...current,
        hospital: {
          ...current.hospital,
          [key]: value,
        },
      }) as SettingsDraft,
    )
    setIsDirty(true)
  }

  const updateThreshold = <K extends keyof ThresholdSettings>(key: K, value: ThresholdSettings[K]) => {
    setDraft((current) =>
      ({
        ...current,
        thresholds: {
          ...current.thresholds,
          [key]: value,
        },
      }) as SettingsDraft,
    )
    setIsDirty(true)
  }

  const updateNotification = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    setDraft((current) =>
      ({
        ...current,
        notifications: {
          ...current.notifications,
          [key]: value,
        },
      }) as SettingsDraft,
    )
    setIsDirty(true)
  }

  const updateRole = <K extends keyof RoleSettings>(roleId: string, key: K, value: RoleSettings[K]) => {
    setDraft((current) =>
      ({
        ...current,
        roles: current.roles.map((role) => (role.id === roleId ? { ...role, [key]: value } : role)),
      }) as SettingsDraft,
    )
    setIsDirty(true)
  }

  const toggleRoleActive = (roleId: string) => {
    setDraft((current) =>
      ({
        ...current,
        roles: current.roles.map((role) =>
          role.id === roleId ? { ...role, active: !role.active } : role,
        ),
      }) as SettingsDraft,
    )
    setIsDirty(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      const snapshot = await saveSettings(draft)
      setDraft(cloneSettings(snapshot))
      setLastSyncedAt(snapshot.updated_at)
      setIsDirty(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    try {
      setSaving(true)
      setError(null)
      const snapshot = await resetSettings()
      setDraft(cloneSettings(snapshot))
      setLastSyncedAt(snapshot.updated_at)
      setIsDirty(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset settings')
    } finally {
      setSaving(false)
    }
  }

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase()
    if (!q) return draft.roles
    return draft.roles.filter((role) =>
      [role.id, role.name, role.access_level, role.scope]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [draft.roles, roleSearch])

  const summaryCards = [
    {
      label: 'Hospital',
      value: hospitalSummary,
      icon: LayoutGrid,
    },
    {
      label: 'Active Roles',
      value: `${activeRoles}/${draft.roles.length}`,
      icon: Users,
    },
    {
      label: 'Alerts Guardrails',
      value: `${draft.thresholds.lactate_warning.toFixed(1)} lactate`,
      icon: ShieldAlert,
    },
    {
      label: 'Channels Live',
      value: `${enabledChannels}/3`,
      icon: Bell,
    },
  ] as const

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffffff_0%,#f7f9fc_40%,#edf3f9_100%)] text-slate-900">
      <div className="mx-auto max-w-[1680px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/75 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.05)] backdrop-blur">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900 sm:text-[2.4rem]">
                Settings & Administration
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-[0.95rem]">
                Configure hospital policy, alert thresholds, notification routing, and user roles from a live backend source.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',
                    isDirty
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700',
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', isDirty ? 'bg-amber-500' : 'bg-emerald-500')} />
                  {isDirty ? 'Unsaved changes' : 'In sync with backend'}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Updated {formatTimestamp(lastSyncedAt)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => loadSettings(true)}
                disabled={refreshing || saving}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <SquarePen className="h-4 w-4" />
                Reset
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Save changes
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon
              return (
                <article
                  key={card.label}
                  className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">{card.label}</p>
                      <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{card.value}</p>
                    </div>
                  </div>
                </article>
              )
            })}
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

          {loading ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <SectionCard
                title="Loading live settings"
                subtitle="Connecting to the backend and pulling the current configuration."
                action={<Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
              >
                <div className="grid gap-3 md:grid-cols-2">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                  ))}
                </div>
              </SectionCard>
              <SectionCard
                title="Sync status"
                subtitle="This panel will update once the configuration is loaded."
              >
                <div className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                  ))}
                </div>
              </SectionCard>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <SectionCard
                title={activeTab}
                subtitle={
                  activeTab === 'Hospital Settings'
                    ? 'Update the hospital identity and locale used across the app.'
                    : activeTab === 'Alert Thresholds'
                    ? 'Tune the thresholds that drive risk escalation.'
                    : activeTab === 'Notification Rules'
                    ? 'Control how and when alerts reach the care team.'
                    : 'Edit access groups and the scope assigned to each role.'
                }
                action={
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Live backend data
                  </span>
                }
              >
                {activeTab === 'Hospital Settings' ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label="Hospital Name"
                      value={draft.hospital.hospital_name}
                      onChange={(value) => updateHospital('hospital_name', value)}
                    />
                    <TextField
                      label="Timezone"
                      value={draft.hospital.timezone}
                      onChange={(value) => updateHospital('timezone', value)}
                    />
                    <TextField
                      label="Date Format"
                      value={draft.hospital.date_format}
                      onChange={(value) => updateHospital('date_format', value)}
                    />
                    <TextField
                      label="Time Format"
                      value={draft.hospital.time_format}
                      onChange={(value) => updateHospital('time_format', value)}
                    />
                    <TextField
                      label="Language"
                      value={draft.hospital.language}
                      onChange={(value) => updateHospital('language', value)}
                    />
                    <TextField
                      label="Default Unit System"
                      value={draft.hospital.default_unit_system}
                      onChange={(value) => updateHospital('default_unit_system', value)}
                    />
                  </div>
                ) : null}

                {activeTab === 'Alert Thresholds' ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <NumberField
                      label="Lactate warning"
                      value={draft.thresholds.lactate_warning}
                      onChange={(value) => updateThreshold('lactate_warning', value)}
                      step="0.1"
                      min={0}
                    />
                    <NumberField
                      label="Lactate critical"
                      value={draft.thresholds.lactate_critical}
                      onChange={(value) => updateThreshold('lactate_critical', value)}
                      step="0.1"
                      min={0}
                    />
                    <NumberField
                      label="Heart rate high"
                      value={draft.thresholds.heart_rate_high}
                      onChange={(value) => updateThreshold('heart_rate_high', value)}
                      min={0}
                    />
                    <NumberField
                      label="Respiratory rate high"
                      value={draft.thresholds.respiratory_rate_high}
                      onChange={(value) => updateThreshold('respiratory_rate_high', value)}
                      min={0}
                    />
                    <NumberField
                      label="SpO2 low"
                      value={draft.thresholds.spo2_low}
                      onChange={(value) => updateThreshold('spo2_low', value)}
                      min={0}
                      step="1"
                    />
                    <NumberField
                      label="Temperature high"
                      value={draft.thresholds.temperature_high}
                      onChange={(value) => updateThreshold('temperature_high', value)}
                      min={0}
                      step="0.1"
                    />
                    <NumberField
                      label="Systolic BP low"
                      value={draft.thresholds.systolic_bp_low}
                      onChange={(value) => updateThreshold('systolic_bp_low', value)}
                      min={0}
                    />
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-sm font-semibold text-slate-900">Policy note</p>
                      <p className="mt-2 text-sm text-slate-500">
                        These values feed the live prediction heuristics and can be re-tuned at any time.
                      </p>
                    </div>
                  </div>
                ) : null}

                {activeTab === 'Notification Rules' ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <TogglePill
                        label="Email notifications"
                        enabled={draft.notifications.email_enabled}
                        onToggle={() => updateNotification('email_enabled', !draft.notifications.email_enabled)}
                        description="Send policy alerts to configured email destinations."
                      />
                      <TogglePill
                        label="SMS notifications"
                        enabled={draft.notifications.sms_enabled}
                        onToggle={() => updateNotification('sms_enabled', !draft.notifications.sms_enabled)}
                        description="Use SMS for urgent escalation when the team is offline."
                      />
                      <TogglePill
                        label="Push notifications"
                        enabled={draft.notifications.push_enabled}
                        onToggle={() => updateNotification('push_enabled', !draft.notifications.push_enabled)}
                        description="Deliver instant push alerts to active responders."
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <NumberField
                        label="Escalation delay (minutes)"
                        value={draft.notifications.escalation_minutes}
                        onChange={(value) => updateNotification('escalation_minutes', value)}
                        min={1}
                      />
                      <TextField
                        label="On-call team"
                        value={draft.notifications.on_call_team}
                        onChange={(value) => updateNotification('on_call_team', value)}
                        placeholder="Rapid Response Team"
                      />
                      <TextField
                        label="Quiet hours start"
                        value={draft.notifications.quiet_hours_start}
                        onChange={(value) => updateNotification('quiet_hours_start', value)}
                        placeholder="22:00"
                      />
                      <TextField
                        label="Quiet hours end"
                        value={draft.notifications.quiet_hours_end}
                        onChange={(value) => updateNotification('quiet_hours_end', value)}
                        placeholder="06:00"
                      />
                    </div>
                  </div>
                ) : null}

                {activeTab === 'User Roles' ? (
                  <div>
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                      <Search className="h-4 w-4 shrink-0 text-slate-400" />
                      <input
                        className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                        placeholder="Search roles, access levels, or scope..."
                        value={roleSearch}
                        onChange={(event) => setRoleSearch(event.target.value)}
                      />
                    </label>

                    <div className="mt-4 space-y-3">
                      {filteredRoles.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
                          No roles match your search.
                        </div>
                      ) : (
                        filteredRoles.map((role) => (
                          <RoleCard
                            key={role.id}
                            role={role}
                            onNameChange={(value) => updateRole(role.id, 'name', value)}
                            onAccessLevelChange={(value) => updateRole(role.id, 'access_level', value)}
                            onMembersChange={(value) => updateRole(role.id, 'members', Number.isNaN(value) ? 0 : value)}
                            onScopeChange={(value) => updateRole(role.id, 'scope', value)}
                            onToggleActive={() => toggleRoleActive(role.id)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </SectionCard>

              <div className="space-y-4">
                <SectionCard
                  title="Live Snapshot"
                  subtitle="A quick read of the currently active configuration."
                  action={<UserRound className="h-4 w-4 text-slate-400" />}
                >
                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Hospital</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{draft.hospital.hospital_name}</p>
                      <p className="mt-1 text-sm text-slate-500">{draft.hospital.timezone}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Thresholds</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">
                        Lactate warning {draft.thresholds.lactate_warning.toFixed(1)}, critical {draft.thresholds.lactate_critical.toFixed(1)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        SpO2 low at {draft.thresholds.spo2_low}% and systolic BP low at {draft.thresholds.systolic_bp_low} mmHg
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Notifications</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{draft.notifications.on_call_team}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {enabledChannels} channels enabled, escalation after {draft.notifications.escalation_minutes} minutes
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Roles</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">
                        {activeRoles} active of {draft.roles.length}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Active users have live access to hospital policy and alert workflows.
                      </p>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Sync Status"
                  subtitle="Controls and state for the current session."
                  action={<SlidersHorizontal className="h-4 w-4 text-slate-400" />}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Backend sync</p>
                        <p className="mt-1 text-sm text-slate-500">{formatTimestamp(lastSyncedAt)}</p>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {error ? 'Needs attention' : 'Healthy'}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-500">
                      Changes are persisted to the FastAPI settings store and auto-refresh every 30 seconds when no edits are pending.
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => loadSettings(true)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Sync now
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        <CalendarDays className="h-4 w-4" />
                        Restore defaults
                      </button>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
