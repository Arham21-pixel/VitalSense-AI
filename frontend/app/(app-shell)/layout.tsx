'use client'

import Link from 'next/link'
import { useState } from 'react'
import { LockKeyhole, Menu, X } from 'lucide-react'
import { PrimaryNavigation } from '@/components/primary-navigation'
import { VoiceAssistant } from '@/components/VoiceAssistant'

export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto min-h-screen max-w-[1700px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 pb-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-sm hover:bg-accent transition-colors"
          >
            <Menu className="h-4 w-4" />
            Menu
          </button>
          <div className="text-lg font-semibold">VitalSense</div>
        </div>

        <div className="grid min-h-[calc(100vh-2rem)] gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="hidden lg:block lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-sm">
                  V
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-tight text-foreground">VitalSense AI</p>
                  <p className="text-xs text-muted-foreground">Patient monitoring</p>
                </div>
              </div>

              <div className="mt-6">
                <PrimaryNavigation />
              </div>

              <div className="mt-6 rounded-3xl border border-border/50 bg-muted/30 px-4 py-4">
                <p className="text-sm font-semibold text-foreground">Live data disabled</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Patient cards, vitals, and reports will appear after a backend feed is connected.
                </p>
              </div>

              <Link
                href="/login"
                className="mt-3 flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100"
              >
                <LockKeyhole className="h-4 w-4" />
                Logout
              </Link>
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-4">{children}</div>
        </div>
      </div>

      <VoiceAssistant />

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm lg:hidden">
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-background p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="text-lg font-semibold">Navigation</div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <PrimaryNavigation />

            <div className="mt-6 rounded-3xl border border-border/50 bg-muted/30 px-4 py-4">
              <p className="text-sm font-semibold text-foreground">Live data disabled</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Patient cards, vitals, and reports will appear after a backend feed is connected.
              </p>
            </div>

            <Link
              href="/login"
              className="mt-4 flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100"
            >
              <LockKeyhole className="h-4 w-4" />
              Logout
            </Link>
          </div>
          <button
            type="button"
            className="absolute inset-y-0 left-[85%] right-0 bg-transparent"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
        </div>
      )}
    </div>
  )
}
