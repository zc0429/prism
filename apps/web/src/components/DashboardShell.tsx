'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, AlertTriangle } from 'lucide-react'
import { SidebarNav } from '@/components/SidebarNav'
import { UserButtonClient } from '@/components/UserButtonClient'
import { Button } from '@/components/ui/button'

export function DashboardShell({
  children,
  plan,
  credits,
}: {
  children: React.ReactNode
  plan: string
  credits: number
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [alertBanner, setAlertBanner] = useState(false)

  useEffect(() => {
    fetch('/api/alerts/send', { method: 'POST' })
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.sent) {
          setAlertBanner(true)
        }
      })
      .catch(() => {
        // ignore
      })
  }, [])

  return (
    <div className="flex min-h-svh">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-secondary border-r border-border p-4 shrink-0">
        <Link href="/dashboard" className="text-lg font-semibold mb-6 text-primary">
          Prism
        </Link>
        <SidebarNav plan={plan} credits={credits} />
        <div className="mt-auto pt-4 border-t border-border">
          <UserButtonClient />
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-60 bg-secondary border-r border-border p-4 flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <Link
                href="/dashboard"
                className="text-lg font-semibold text-primary"
                onClick={() => setMobileOpen(false)}
              >
                Prism
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setMobileOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <SidebarNav plan={plan} credits={credits} onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto pt-4 border-t border-border">
              <UserButtonClient />
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0 min-w-0 bg-background">
        {/* Alert banner */}
        {alertBanner && (
          <div className="px-4 py-2.5 bg-destructive/10 border-b border-destructive/20">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>余额不足预警邮件已发送，请及时充值以免影响使用。</span>
              <button
                onClick={() => setAlertBanner(false)}
                className="ml-auto text-xs underline underline-offset-2 hover:opacity-80"
              >
                忽略
              </button>
            </div>
          </div>
        )}

        {/* Mobile topbar */}
        <div className="flex md:hidden items-center gap-3 px-4 py-3 border-b border-border bg-secondary">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setMobileOpen(true)}>
            <Menu className="size-4" />
          </Button>
          <Link href="/dashboard" className="text-sm font-semibold text-primary">
            Prism
          </Link>
        </div>

        {/* Breadcrumb bar */}
        <div className="px-6 pt-6 pb-2 hidden md:block">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </nav>
        </div>

        {/* Page content */}
        <div className="flex-1 px-4 md:px-6 pb-6 pt-4 md:pt-0">{children}</div>
      </main>
    </div>
  )
}
