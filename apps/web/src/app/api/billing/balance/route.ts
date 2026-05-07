import { auth } from '@/auth'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const [user] = await db
    .select({
      plan: users.plan,
      credits: users.credits,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  return Response.json({
    data: {
      plan: user.plan,
      credits: user.credits,
    },
  })
}