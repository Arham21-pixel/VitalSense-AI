'use client'

import { useState } from 'react'
import { Eye, EyeOff, HeartPulse, CheckCircle2, ChevronRight, Mail, Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '../Logo'

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#f5f8fd] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1340px] overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_80px_rgba(14,28,47,0.08)] ring-1 ring-slate-200/70">
        <section className="relative flex w-full flex-col justify-between overflow-hidden bg-white px-6 py-8 sm:px-10 lg:w-[58%] lg:px-16 lg:py-12">
          <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-[#16b57b]/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#00A86B]/10 blur-3xl" />

          <div className="relative z-10 flex items-center">
            <Logo className="scale-[0.85] origin-left" />
          </div>

          <div className="relative z-10 mt-10 max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6b7a90]">
              Secure access
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-[#102030] sm:text-5xl">
              Welcome to your ICU command center
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#5b6b81] sm:text-lg">
              Real-time sepsis prediction, SHAP explanations, and live patient telemetry in one
              place.
            </p>

            <form
              className="mt-10 space-y-5"
              onSubmit={(event) => {
                event.preventDefault()
                router.push('/dashboard')
              }}
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#5d6d84]"
                >
                  Username
                </label>
                <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-[#16a34a]/40 focus-within:ring-4 focus-within:ring-[#16a34a]/10">
                  <Mail className="h-4 w-4 shrink-0 text-[#9aa6b8]" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue="doctor@hospital.com"
                    className="w-full bg-transparent text-[0.98rem] text-[#102030] outline-none placeholder:text-[#9aa6b8]"
                    placeholder="doctor@hospital.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#5d6d84]"
                >
                  Password
                </label>
                <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-[#16a34a]/40 focus-within:ring-4 focus-within:ring-[#16a34a]/10">
                  <Lock className="h-4 w-4 shrink-0 text-[#9aa6b8]" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    defaultValue="password"
                    className="w-full bg-transparent text-[0.98rem] text-[#102030] outline-none placeholder:text-[#9aa6b8]"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="shrink-0 rounded-full p-1 text-[#9aa6b8] transition hover:bg-slate-100 hover:text-[#6b7a90]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#121a2b] text-sm font-semibold text-white shadow-[0_20px_40px_rgba(18,26,43,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0e1524]"
              >
                Sign In
                <ChevronRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-4 text-center text-sm text-[#627089]">
              Don&apos;t have an account?{' '}
              <Link href="mailto:admin@vitalsense.ai" className="font-semibold text-[#0f8f63] hover:underline">
                Contact Admin
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-4 text-[0.72rem] uppercase tracking-[0.2em] text-[#9aa6b8]">
              <div className="h-px flex-1 bg-slate-200" />
              or continue with
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: 'Google', className: 'bg-[#4285F4]' },
                { label: 'Apple', className: 'bg-[#111827]' },
                { label: 'Facebook', className: 'bg-[#1877F2]' },
              ].map((provider) => (
                <button
                  key={provider.label}
                  type="button"
                  className={`${provider.className} flex h-10 items-center justify-center rounded-full text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:opacity-90`}
                  aria-label={`Continue with ${provider.label}`}
                >
                  {provider.label}
                </button>
              ))}
            </div>
          </div>

          <p className="relative z-10 mt-10 text-sm text-[#8a97aa]">
            Protected access for doctors, nurses, and ICU coordinators.
          </p>
        </section>

        <aside className="hidden lg:flex lg:w-[42%] lg:flex-col lg:justify-center lg:px-16 lg:py-12 bg-[#eefbf3]">
          <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_15px_40px_rgba(16,32,48,0.08)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#e2f6ea] to-[#d5e8ff] text-[#0f8f63]">
                <HeartPulse className="h-5 w-5" />
              </div>
            </div>

            <h2 className="mt-8 text-2xl font-semibold tracking-tight text-[#0f6f5a]">
              Real-Time ICU Monitoring
            </h2>

            <ul className="mt-8 space-y-5 text-left">
              {[
                'Live sepsis risk predictions every 15 seconds',
                'XGBoost + LSTM ensemble ML models',
                'SHAP explainability for every alert',
                'WebSocket streaming to clinician dashboard',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[#0f5f57]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0ea673]" />
                  <span className="text-[0.98rem] leading-6">{item}</span>
                </li>
              ))}
            </ul>

            <blockquote className="mt-12 max-w-sm rounded-[1.5rem] bg-white/75 px-8 py-7 text-center shadow-[0_18px_50px_rgba(16,32,48,0.06)] backdrop-blur">
              <p className="text-lg font-medium italic text-[#115b51]">
                We don&apos;t wait for sepsis. We predict it.
              </p>
              <footer className="mt-2 text-sm text-[#6f7f89]">Team VITALSENSE</footer>
            </blockquote>
          </div>
        </aside>
      </div>
    </main>
  )
}
