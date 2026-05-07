import { auth } from '@/auth'
import { eq, and, gte, desc, sql } from 'drizzle-orm'
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
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? '20')))

  const days = getDays(range)
  const since = new Date()
  since.setDate(since.getDate() - days)

  const whereCondition = and(
    eq(usageLogs.userId, userId),
    gte(usageLogs.createdAt, since)
  )

  const [countResult] = await db
    .select({ total: sql<number>`CAST(COUNT(*) AS INTEGER)`.mapWith(Number) })
    .from(usageLogs)
    .where(whereCondition)

  const data = await db
    .select({
      id: usageLogs.id,
      createdAt: usageLogs.createdAt,
      toolId: usageLogs.toolId,
      model: usageLogs.model,
      inputTokens: usageLogs.inputTokens,
      outputTokens: usageLogs.outputTokens,
      costUsd: usageLogs.costUsd,
    })
    .from(usageLogs)
    .where(whereCondition)
    .orderBy(desc(usageLogs.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return Response.json({
    data,
    total: countResult?.total ?? 0,
  })
}