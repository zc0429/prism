import { auth } from '@/auth'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { z } from 'zod'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [user] = await db
    .select({
      alertThreshold: users.alertThreshold,
      alertEnabled: users.alertEnabled,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  return Response.json({
    data: {
      threshold: user?.alertThreshold ?? 50,
      enabled: user?.alertEnabled ?? true,
    },
  })
}

const putSchema = z.object({
  threshold: z.number().int().min(0).max(10000).optional(),
  enabled: z.boolean().optional(),
})

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.threshold !== undefined) updates.alertThreshold = parsed.data.threshold
  if (parsed.data.enabled !== undefined) updates.alertEnabled = parsed.data.enabled

  await db
    .update(users)
    .set(updates)
    .where(eq(users.id, session.user.id))

  return Response.json({ success: true, data: parsed.data })
}
