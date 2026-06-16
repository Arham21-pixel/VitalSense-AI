import type { Metadata } from 'next'

import { PatientMonitoringPage } from '@/components/patient-monitoring-page'

export const metadata: Metadata = {
  title: 'VitalSense AI | Patients',
  description: 'Selectable ICU patient list with detailed live reports.',
}

export default function PatientsPage() {
  return <PatientMonitoringPage />
}
