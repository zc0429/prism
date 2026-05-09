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
    const budgetLimit = key.budgetLimit
    if (!budgetLimit || budgetLimit <= 0) continue

    // 使用事务防止竞态条件：检查与更新原子化
    const result = await db.transaction(async (tx) => {
      // 重新读取当前状态（行锁）
      const [current] = await tx
        .select({ budgetUsed: virtualKeys.budgetUsed, isActive: virtualKeys.isActive })
        .from(virtualKeys)
        .where(eq(virtualKeys.id, key.id))
        .limit(1)

      if (!current || !current.isActive) return { fused: false, updated: false }

      // 从 usage_logs 汇总实际消耗（按 requestId 关联）
      const [usageResult] = await tx
        .select({
          totalCost: sql<number>`COALESCE(SUM(${usageLogs.costUsd}), 0)`.mapWith(Number),
        })
        .from(usageLogs)
        .where(and(eq(usageLogs.userId, userId), eq(usageLogs.requestId, key.litellmKeyId)))

      const actualUsed = usageResult?.totalCost ?? current.budgetUsed ?? 0

      if (actualUsed >= budgetLimit) {
        await tx
          .update(virtualKeys)
          .set({ isActive: false, budgetUsed: actualUsed })
          .where(eq(virtualKeys.id, key.id))
        return { fused: true, updated: true }
      }

      if (actualUsed !== (current.budgetUsed ?? 0)) {
        await tx
          .update(virtualKeys)
          .set({ budgetUsed: actualUsed })
          .where(eq(virtualKeys.id, key.id))
        return { fused: false, updated: true }
      }

      return { fused: false, updated: false }
    })

    if (result.fused) {
      fused.push(key.litellmKeyId)
    }
  }

  return Response.json({
    data: {
      checked: keys.length,
      fused,
    },
  })
}
