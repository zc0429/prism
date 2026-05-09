import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { apiKeys } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { decryptApiKey } from '@/lib/crypto'

function isPrivateUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr)
    const hostname = url.hostname.toLowerCase()
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') return true
    // IPv4 private ranges
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|127\.|0\.)/.test(hostname)) return true
    // IPv6 loopback / link-local / ULA
    if (/^::$|^::1$|^fc00:/i.test(hostname)) return true
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return true
    return false
  } catch {
    return true
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const { baseUrl, apiKey, provider } = await request.json()

  if (!baseUrl || typeof baseUrl !== 'string') {
    return NextResponse.json({ error: 'Missing baseUrl' }, { status: 400 })
  }

  if (isPrivateUrl(baseUrl)) {
    return NextResponse.json({ error: 'Invalid baseUrl' }, { status: 400 })
  }

  let key = apiKey
  if (!key && provider) {
    const rows = await db
      .select({ keyHash: apiKeys.keyHash })
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider)))
      .orderBy(desc(apiKeys.createdAt))
      .limit(1)

    if (rows[0]) {
      try {
        key = decryptApiKey(rows[0].keyHash)
      } catch {
        return NextResponse.json({ error: 'Failed to decrypt API key' }, { status: 500 })
      }
    }
  }

  if (!key) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 400 })
  }

  const start = Date.now()
  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10_000),
    })
    const latency = Date.now() - start
    if (res.ok) {
      return NextResponse.json({ success: true, latency })
    }
    return NextResponse.json({ success: false, latency, error: `HTTP ${res.status}` })
  } catch (e) {
    return NextResponse.json({
      success: false,
      latency: Date.now() - start,
      error: (e as Error).message,
    })
  }
}
