import type { Metadata } from 'next'

import { AlertCenterPage } from '@/components/alert-center-page'

export const metadata: Metadata = {
  title: 'VitalSense AI | Alert Center',
  description: 'Monitor, assign, and escalate ICU alerts in real time.',
}

export default function AlertsPage() {
  return <AlertCenterPage />
}
