import type { Metadata } from 'next'

import { DashboardOverview } from '@/components/dashboard-overview'

export const metadata: Metadata = {
  title: 'VitalSense AI | Dashboard',
  description: 'Real-time ICU dashboard with risk distribution, alerts, and AI summary.',
}

export default function DashboardPage() {
  return <DashboardOverview />
}
