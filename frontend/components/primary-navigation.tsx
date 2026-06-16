'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { Activity, Bell, Settings, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Activity },
  { label: 'Patient Details', href: '/dashboard/patients', icon: Users },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'Settings', href: '/settings', icon: Settings },
]

function normalizePathname(pathname: string) {
  return pathname.replace(/\/$/, '') || '/'
}

function findActiveNavItem(currentPath: string) {
  const matches = navItems.filter(
    (item) =>
      currentPath === item.href ||
      (item.href !== '/' && currentPath.startsWith(`${item.href}/`)),
  )

  return matches.reduce((longest, item) => {
    if (!longest || item.href.length > longest.href.length) {
      return item
    }
    return longest
  }, null as NavItem | null)
}

export function PrimaryNavigation({
  pathname,
  className,
}: {
  pathname?: string
  className?: string
}) {
  const activePath = pathname ?? usePathname() ?? '/'
  const currentPath = normalizePathname(activePath)
  const activeItem = findActiveNavItem(currentPath)

  return (
    <nav className={cn('w-full max-w-[260px] rounded-3xl border border-border/60 bg-card/90 p-3 shadow-sm', className)}>
      <div className="space-y-2">
        {navItems.map((item) => {
          const isActive = activeItem?.href === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-slate-50 text-foreground/80 hover:bg-slate-100 hover:text-foreground hover:border-slate-200',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                  isActive ? 'bg-white/10 text-primary-foreground' : 'bg-slate-100 text-muted-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-left">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
