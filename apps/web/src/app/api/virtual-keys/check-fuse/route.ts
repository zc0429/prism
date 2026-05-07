import { auth } from '@/auth'
import { eq, and, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { virtualKeys, usageLogs } from '@/lib/db/schema'

/**
 * 检查虚拟密钥预算并自动熔断
 *
 * 遍历用户所有虚拟密钥，若 budgetUsed >= budgetLimit 则设置 isActive = false
 */
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // 获取用户所有活跃的虚拟密钥
  const keys = await db
    .select({
      id: virtualKeys.id,
      litellmKeyId: virtualKeys.litellmKeyId,
      budgetLimit: virtualKeys.budgetLimit,
      budgetUsed: virtualKeys.budgetUsed,
      isActive: virtualKeys.isActive,
    })
    .from(virtualKeys)
    .where(and(eq(virtualKeys.userId, userId), eq(virtualKeys.isActive, true)))

  const fused: string[] = []

  for (const key of keys) {
    if (!key.budgetLimit || key.budgetLimit <= 0) continue

    // 从 usage_logs 汇总实际消耗（按 requestId 关联）
    const [usageResult] = await db
      .select({
        totalCost: sql<number>`COALESCE(SUM(${usageLogs.costUsd}), 0)`.mapWith(Number),
      })
      .from(usageLogs)
      .where(and(eq(usageLogs.userId, userId), eq(usageLogs.requestId, key.litellmKeyId)))

    const actualUsed = usageResult?.totalCost ?? key.budgetUsed ?? 0

    if (actualUsed >= key.budgetLimit) {
      await db
        .update(virtualKeys)
        .set({ isActive: false, budgetUsed: actualUsed })
        .where(eq(virtualKeys.id, key.id))
      fused.push(key.litellmKeyId)
    } else if (actualUsed !== (key.budgetUsed ?? 0)) {
      await db
        .update(virtualKeys)
        .set({ budgetUsed: actualUsed })
        .where(eq(virtualKeys.id, key.id))
    }
  }

  return Response.json({
    data: {
      checked: keys.length,
      fused,
    },
  })
}
