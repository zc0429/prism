import { auth } from '@/auth'
import { sql, eq, and, gte } from 'drizzle-orm'
import { db } from '@/lib/db'
import { usageLogs } from '@/lib/db/schema'

function getDays(range: string): number {
  if (range === '7d') return 7
  if (range === '90d') return 90
  return 30
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') ?? '30d'
  const days = getDays(range)

  const since = new Date()
  since.setDate(since.getDate() - days)

  const where = and(eq(usageLogs.userId, userId), gte(usageLogs.createdAt, since))

  const [tokenResult] = await db
    .select({
      totalInput: sql<number>`COALESCE(SUM(${usageLogs.inputTokens}), 0)`.mapWith(Number),
      totalOutput: sql<number>`COALESCE(SUM(${usageLogs.outputTokens}), 0)`.mapWith(Number),
      totalCost: sql<number>`COALESCE(SUM(${usageLogs.costUsd}), 0)`.mapWith(Number),
      activeModels: sql<number>`CAST(COUNT(DISTINCT ${usageLogs.model}) AS INTEGER)`.mapWith(Number),
    })
    .from(usageLogs)
    .where(where)

  const modelDistribution = await db
    .select({
      model: usageLogs.model,
      count: sql<number>`CAST(COUNT(*) AS INTEGER)`.mapWith(Number),
    })
    .from(usageLogs)
    .where(where)
    .groupBy(usageLogs.model)

  const dailyUsage = await db
    .select({
      date: sql<string>`DATE(${usageLogs.createdAt})`.mapWith(String),
      inputTokens: sql<number>`COALESCE(SUM(${usageLogs.inputTokens}), 0)`.mapWith(Number),
      outputTokens: sql<number>`COALESCE(SUM(${usageLogs.outputTokens}), 0)`.mapWith(Number),
    })
    .from(usageLogs)
    .where(where)
    .groupBy(sql`DATE(${usageLogs.createdAt})`)
    .orderBy(sql`DATE(${usageLogs.createdAt})`)

  return Response.json({
    data: {
      totalTokens: (tokenResult?.totalInput ?? 0) + (tokenResult?.totalOutput ?? 0),
      totalCost: tokenResult?.totalCost ?? 0,
      activeModels: tokenResult?.activeModels ?? 0,
      modelDistribution,
      dailyUsage,
    },
  })
}