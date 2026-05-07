import { auth } from '@/auth'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { apiKeys } from '@/lib/db/schema'
import { encryptApiKey, keyHint } from '@/lib/crypto'

const postSchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'google', 'deepseek']),
  apiKey: z.string().min(1),
  label: z.string().optional(),
})

async function getAuthUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

export async function POST(request: Request) {
  const userId = await getAuthUserId()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 })
  }

  const { provider, apiKey, label } = parsed.data
  const hash = encryptApiKey(apiKey)
  const hint = keyHint(apiKey)

  const created = await db.insert(apiKeys).values({
    userId,
    provider,
    keyHash: hash,
    keyHint: hint,
    label: label ?? null,
  }).returning()

  const row = created[0]!
  return Response.json({ data: { id: row.id, provider, hint, label } }, { status: 201 })
}

export async function GET() {
  const userId = await getAuthUserId()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const keys = await db.select({
    id: apiKeys.id,
    provider: apiKeys.provider,
    keyHint: apiKeys.keyHint,
    label: apiKeys.label,
    isActive: apiKeys.isActive,
    createdAt: apiKeys.createdAt,
  }).from(apiKeys).where(eq(apiKeys.userId, userId))

  return Response.json({ data: keys })
}

export async function DELETE(request: Request) {
  const userId = await getAuthUserId()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const keyId = searchParams.get('id')
  if (!keyId) {
    return Response.json({ error: 'Missing key id' }, { status: 400 })
  }

  await db.delete(apiKeys).where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))

  return Response.json({ data: 'deleted' })
}
