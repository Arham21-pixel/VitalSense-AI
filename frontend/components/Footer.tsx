'use client'

import Link from 'next/link'
import { Mail, MessageCircle, Share2 } from 'lucide-react'

export function Footer() {
  const footerLinks = [
    {
      heading: 'Product',
      links: [
        { label: 'Platform', href: '#platform' },
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'ROI', href: '#roi' },
        { label: 'Enterprise', href: '#enterprise' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Patients', href: '/dashboard/patients' },
        { label: 'Alerts', href: '/alerts' },
        { label: 'Settings', href: '/settings' },
      ],
    },
    {
      heading: 'Resources',
      links: [
        { label: 'FAQ', href: '#faq' },
        { label: 'Login', href: '/login' },
        { label: 'Contact', href: '#contact' },
        { label: 'Support', href: 'mailto:admin@vitalsense.ai' },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Privacy', href: '#contact' },
        { label: 'Terms', href: '#contact' },
        { label: 'HIPAA', href: '#enterprise' },
        { label: 'Compliance', href: '#enterprise' },
      ],
    },
  ]

  const socialLinks = [
    { icon: Share2, label: 'LinkedIn' },
    { icon: MessageCircle, label: 'Twitter' },
    { icon: Mail, label: 'Email' },
  ]

  return (
    <footer id="contact" className="relative overflow-hidden bg-secondary text-secondary-foreground">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-primary/5 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
                V
              </div>
              <span className="text-lg font-bold tracking-tight">VitalSense</span>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              AI-powered sepsis prediction for ICU teams. Modern healthcare intelligence.
            </p>
            <a
              href="mailto:admin@vitalsense.ai"
              className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Book Demo
            </a>
            <div className="mt-6 flex flex-wrap gap-2">
              {['HIPAA', 'SOC 2', 'GDPR'].map((item) => (
                <span
                  key={item}
                  className="rounded-md border border-border/10 bg-background/10 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.heading}>
              <h3 className="mb-5 text-sm font-semibold text-foreground">{section.heading}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('mailto:') ? (
                      <a href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mb-8 mt-10 border-t border-border/20" />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            © {new Date().getFullYear()} VitalSense Inc. All rights reserved.
          </p>
          <div className="flex gap-5">
            {socialLinks.map(({ icon: Icon, label }) => (
              <button
                key={label}
                type="button"
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label={label}
              >
                <Icon size={20} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
