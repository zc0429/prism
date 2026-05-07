import { auth } from '@/auth'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { sendEmail, buildLowBalanceAlert } from '@/lib/email'

/**
 * 检查余额并发送预警邮件
 *
 * 调用时机：Dashboard 页面加载时
 * 防重发：同一用户 24 小时内只发一次
 */
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const [user] = await db
    .select({
      email: users.email,
      name: users.name,
      credits: users.credits,
      alertThreshold: users.alertThreshold,
      alertEnabled: users.alertEnabled,
      lastAlertSentAt: users.lastAlertSentAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  if (!user.alertEnabled) {
    return Response.json({ data: { sent: false, reason: 'alert_disabled' } })
  }

  if (user.credits > (user.alertThreshold ?? 50)) {
    return Response.json({ data: { sent: false, reason: 'above_threshold' } })
  }

  // 24 小时内已发送过，不再重复
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  if (user.lastAlertSentAt && user.lastAlertSentAt > twentyFourHoursAgo) {
    return Response.json({ data: { sent: false, reason: 'already_sent_recently' } })
  }

  const payload = buildLowBalanceAlert({
    userName: user.name ?? user.email ?? '用户',
    balance: user.credits,
    threshold: user.alertThreshold ?? 50,
  })
  payload.to = user.email

  const result = await sendEmail(payload)

  if (result.success) {
    await db
      .update(users)
      .set({ lastAlertSentAt: new Date() })
      .where(eq(users.id, userId))
  }

  return Response.json({
    data: {
      sent: result.success,
      balance: user.credits,
      threshold: user.alertThreshold,
      error: result.error,
    },
  })
}
