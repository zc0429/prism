import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 })
  }

  const { email, password } = parsed.data

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (existing) {
    return Response.json({ error: '该邮箱已被注册' }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 12)
  const created = await db.insert(users).values({ email, passwordHash: hash }).returning()
  const row = created[0]!

  return Response.json({ data: { id: row.id, email: row.email } }, { status: 201 })
}
