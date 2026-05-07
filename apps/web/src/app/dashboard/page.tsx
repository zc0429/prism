import { auth } from '@/auth'
import { eq, and, gte, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { usageLogs, installedTools, users } from '@/lib/db/schema'
import Link from 'next/link'
import {
  CreditCard,
  Cpu,
  Download,
  Settings,
} from 'lucide-react'

async function getDashboardData(userId: string) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [tokenResult] = await db
    .select({
      totalInput: sql<number>`COALESCE(SUM(${usageLogs.inputTokens}), 0)`.mapWith(Number),
      totalOutput: sql<number>`COALESCE(SUM(${usageLogs.outputTokens}), 0)`.mapWith(Number),
      totalCost: sql<number>`COALESCE(SUM(${usageLogs.costUsd}), 0)`.mapWith(Number),
    })
    .from(usageLogs)
    .where(and(eq(usageLogs.userId, userId), gte(usageLogs.createdAt, thirtyDaysAgo)))

  const installedCount = await db.$count(installedTools, eq(installedTools.userId, userId))
  const activeCount = await db.$count(
    installedTools,
    and(
      eq(installedTools.userId, userId),
      gte(installedTools.lastActiveAt, thirtyDaysAgo)
    )
  )

  const [user] = await db
    .select({ plan: users.plan, credits: users.credits })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return {
    totalTokens: (tokenResult?.totalInput ?? 0) + (tokenResult?.totalOutput ?? 0),
    totalCost: tokenResult?.totalCost ?? 0,
    installedTools: installedCount,
    activeTools: activeCount,
    plan: user?.plan ?? 'free',
    credits: user?.credits ?? 0,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  const data = session?.user?.id
    ? await getDashboardData(session.user.id)
    : { totalTokens: 0, totalCost: 0, installedTools: 0, activeTools: 0, plan: 'free', credits: 0 }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-6">概览</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">月度 Tokens</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{data.totalTokens.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">月度费用</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">${data.totalCost.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">积分余额</p>
          <p className="text-3xl font-semibold tracking-tight text-primary">{data.credits.toLocaleString('zh-CN')}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">已安装工具</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{data.installedTools}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">活跃工具</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{data.activeTools}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">当前计划</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground capitalize">{data.plan}</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground mb-4">快速操作</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Link href="/dashboard/models">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Cpu className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">配置模型</p>
                <p className="text-xs text-muted-foreground">BYOK 或充值模型</p>
              </div>
            </div>
          </Link>
          <Link href="/dashboard/billing">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <CreditCard className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">充值积分</p>
                <p className="text-xs text-muted-foreground">微信 / 支付宝</p>
              </div>
            </div>
          </Link>
          <Link href="/download">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Download className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">下载客户端</p>
                <p className="text-xs text-muted-foreground">Windows / macOS / Linux</p>
              </div>
            </div>
          </Link>
          <Link href="/setup">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Settings className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Claude Code 配置</p>
                <p className="text-xs text-muted-foreground">检测环境并安装配置</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
