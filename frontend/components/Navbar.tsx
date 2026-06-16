'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { label: 'Platform', href: '#platform' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'ROI', href: '#roi' },
    { label: 'Enterprise', href: '#enterprise' },
  ]

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm group-hover:shadow-md transition-all duration-300">
              V
            </div>
            <span className="hidden sm:inline font-bold text-foreground tracking-tight text-lg">VitalSense</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card p-2 text-muted-foreground shadow-sm transition-colors hover:bg-accent md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:inline">
              <span className="inline-flex px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors">
                Sign In
              </span>
            </Link>
            <Link href="#contact" className="hidden sm:inline">
              <span className="px-5 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg shadow-sm shadow-primary/25 hover:bg-primary/90 transition-all duration-200">
                Book Demo
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm md:hidden">
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-background border-r border-border/70 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm">
                  V
                </div>
                <span className="text-lg font-bold text-foreground">VitalSense</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-4 py-3 text-base font-medium text-foreground hover:bg-muted transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="#contact"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Book Demo
              </Link>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-y-0 left-[85%] right-0 bg-transparent"
          />
        </div>
      )}
    </>
  )
}
