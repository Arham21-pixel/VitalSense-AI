import type { Metadata } from 'next'

import { SettingsAdminPage } from '@/components/settings-admin-page'

export const metadata: Metadata = {
  title: 'VitalSense AI | Settings & Administration',
  description: 'Manage hospital settings, user roles, thresholds, and notification rules.',
}

export default function SettingsPage() {
  return <SettingsAdminPage />
}
