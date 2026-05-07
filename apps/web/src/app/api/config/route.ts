import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { encryptApiKey, decryptApiKey } from '@/lib/crypto'

function encryptConfigValues(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj
  if (Array.isArray(obj)) {
    return obj.map(encryptConfigValues)
  }
  const record = obj as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(record)) {
    if (k === 'apiKey' && typeof v === 'string' && v.length > 0 && !v.startsWith('enc:')) {
      result[k] = 'enc:' + encryptApiKey(v)
    } else {
      result[k] = encryptConfigValues(v)
    }
  }
  return result
}

function decryptConfigValues(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj
  if (Array.isArray(obj)) {
    return obj.map(decryptConfigValues)
  }
  const record = obj as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(record)) {
    if (k === 'apiKey' && typeof v === 'string' && v.startsWith('enc:')) {
      try {
        result[k] = decryptApiKey(v.slice(4))
      } catch {
        result[k] = v
      }
    } else {
      result[k] = decryptConfigValues(v)
    }
  }
  return result
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [user] = await db
    .select({ config: users.config })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const config = user?.config ?? {}
  const decrypted = decryptConfigValues(config)

  return NextResponse.json({
    apiKeys: {},
    models: [],
    config: decrypted,
  })
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const encrypted = encryptConfigValues(body)

  await db
    .update(users)
    .set({ config: encrypted as Record<string, unknown> })
    .where(eq(users.id, session.user.id))

  return NextResponse.json({ success: true, data: encrypted })
}
