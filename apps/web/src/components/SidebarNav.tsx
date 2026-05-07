'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Wrench,
  Cpu,
  BarChart3,
  CreditCard,
  Settings,
  ChevronRight,
  Plus,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: '概览', icon: LayoutDashboard },
  { href: '/dashboard/tools', label: '工具管理', icon: Wrench },
  { href: '/dashboard/models', label: '模型管理', icon: Cpu },
  { href: '/dashboard/usage', label: '用量详情', icon: BarChart3 },
  { href: '/dashboard/billing', label: '充值订阅', icon: CreditCard },
  { href: '/dashboard/settings', label: '账户设置', icon: Settings },
]

export function SidebarNav({
  onNavigate,
  plan,
  credits,
}: {
  onNavigate?: () => void
  plan?: string
  credits?: number
}) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={
                'flex items-center gap-3 text-sm px-3 py-2 rounded-md transition-colors ' +
                (isActive
                  ? 'bg-card shadow-sm text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground')
              }
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {typeof credits === 'number' && (
        <div className="mt-auto pt-4 flex flex-col gap-2">
          <Link
            href="/dashboard/billing"
            onClick={onNavigate}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-border-dark"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-muted-foreground">账户余额</p>
                {plan && plan !== 'free' && (
                  <span className="text-[10px] px-1.5 py-0 rounded-full bg-primary/10 text-primary font-medium capitalize">
                    {plan}
                  </span>
                )}
              </div>
              <p className="text-base font-semibold text-foreground">
                {credits.toLocaleString('zh-CN')}
                <span className="ml-1 text-xs font-normal text-muted-foreground">积分</span>
              </p>
            </div>
            <ChevronRight className="size-3.5 text-muted-foreground" />
          </Link>
          <Link
            href="/dashboard/billing"
            onClick={onNavigate}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors px-1"
          >
            <Plus className="size-3.5" />
            立即充值
          </Link>
        </div>
      )}
    </div>
  )
}
