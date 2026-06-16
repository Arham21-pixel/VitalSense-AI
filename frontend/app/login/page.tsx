import type { Metadata } from 'next'
import { LoginPage } from '@/components/auth/login-page'

export const metadata: Metadata = {
  title: 'VitalSense AI | Login',
  description: 'Sign in to the VitalSense AI ICU command center.',
}

export default function Page() {
  return <LoginPage />
}
