import { auth } from '@/auth'
import { db } from '@/lib/db'
import { transactions } from '@/lib/db/schema'
import { z } from 'zod'

const rechargePlans = [
  { id: 'topup-10', amount: 10, credits: 100 },
  { id: 'topup-50', amount: 50, credits: 500 },
  { id: 'topup-100', amount: 100, credits: 1000 },
  { id: 'topup-500', amount: 500, credits: 5000 },
]

const postSchema = z.object({
  planId: z.string(),
  paymentMethod: z.enum(['alipay', 'wechat']),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const body = await request.json()
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 })
  }

  const { planId, paymentMethod } = parsed.data
  const plan = rechargePlans.find((p) => p.id === planId)
  if (!plan) {
    return Response.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const [created] = await db
    .insert(transactions)
    .values({
      userId,
      type: 'topup',
      amount: plan.amount,
      currency: 'CNY',
      credits: plan.credits,
      status: 'pending',
    })
    .returning()

  const mockQrUrl = `https://mock-pay.example.com/${paymentMethod}/${created?.id}`

  return Response.json({
    data: {
      transactionId: created?.id,
      mockQrUrl,
      amount: plan.amount,
      credits: plan.credits,
      paymentMethod,
    },
  })
}
