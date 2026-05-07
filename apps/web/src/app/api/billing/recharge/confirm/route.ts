import { auth } from '@/auth'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { transactions, users } from '@/lib/db/schema'
import { z } from 'zod'

const postSchema = z.object({
  transactionId: z.string().uuid(),
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

  const { transactionId } = parsed.data

  const result = await db.transaction(async (tx) => {
    const [txRecord] = await tx
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1)

    if (!txRecord) {
      throw new Error('Transaction not found')
    }

    if (txRecord.userId !== userId) {
      throw new Error('Forbidden')
    }

    if (txRecord.status !== 'pending') {
      throw new Error('Transaction already processed')
    }

    const [updatedTx] = await tx
      .update(transactions)
      .set({ status: 'completed' })
      .where(eq(transactions.id, transactionId))
      .returning()

    const [user] = await tx
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw new Error('User not found')
    }

    const newCredits = user.credits + (updatedTx?.credits ?? 0)

    await tx
      .update(users)
      .set({ credits: newCredits })
      .where(eq(users.id, userId))

    return { transaction: updatedTx, balance: newCredits }
  })

  return Response.json({ data: result })
}
