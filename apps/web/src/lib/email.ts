/**
 * Email service — 预警邮件发送
 *
 * 当前为 mock 实现（打印到日志），生产环境可替换为 nodemailer 或第三方邮件 API
 */

export interface EmailPayload {
  to: string
  subject: string
  body: string
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  const smtpHost = process.env.SMTP_HOST

  if (!smtpHost) {
    // Mock: 打印到控制台，生产环境接入真实 SMTP
    console.log('[Email Mock]')
    console.log(`  To: ${payload.to}`)
    console.log(`  Subject: ${payload.subject}`)
    console.log(`  Body: ${payload.body.slice(0, 200)}...`)
    return { success: false, error: 'SMTP not configured' }
  }

  // 生产环境接入 nodemailer 或 Resend / SendGrid
  // const nodemailer = await import('nodemailer')
  // ...

  return { success: false, error: 'SMTP not configured' }
}

export function buildLowBalanceAlert({
  userName,
  balance,
  threshold,
}: {
  userName: string
  balance: number
  threshold: number
}): EmailPayload {
  return {
    to: '',
    subject: '【Prism】余额不足提醒',
    body: `您好 ${userName}，\n\n您的 Prism 账户余额已低于预警阈值。\n\n当前余额：${balance} 积分\n预警阈值：${threshold} 积分\n\n请及时充值，以免影响模型使用。\n\n前往充值：https://prism.local/dashboard/billing\n\n—— Prism 团队`,
  }
}
