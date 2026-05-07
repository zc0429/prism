import { auth } from '@/auth'
import { eq, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { transactions } from '@/lib/db/schema'
import { z } from 'zod'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') ?? '20')))

  const data = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return Response.json({ data })
}

const postSchema = z.object({
  type: z.enum(['topup']),
  amount: z.number().int().positive(),
  currency: z.string().default('CNY'),
  credits: z.number().int().positive(),
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

  const { type, amount, currency, credits } = parsed.data

  const [created] = await db.insert(transactions).values({
    userId,
    type,
    amount,
    currency,
    credits,
    status: 'pending',
  }).returning()

  return Response.json({ data: created }, { status: 201 })
}
