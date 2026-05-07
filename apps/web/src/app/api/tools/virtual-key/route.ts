import { auth } from '@/auth'
import { db } from '@/lib/db'
import { virtualKeys } from '@/lib/db/schema'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const gatewayUrl = process.env.LITELLM_GATEWAY_URL ?? 'http://localhost:4000'
    const res = await fetch(`${gatewayUrl}/key/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    if (!res.ok) {
      return Response.json({ error: 'Failed to generate key from LiteLLM' }, { status: 502 })
    }

    const data = await res.json()
    const litellmKeyId = data.key?.key_id ?? data.key?.id ?? ''
    const keyValue = data.key?.key ?? data.key?.token ?? ''

    if (!keyValue) {
      return Response.json({ error: 'No key returned from LiteLLM' }, { status: 502 })
    }

    await db.insert(virtualKeys).values({
      userId,
      litellmKeyId: litellmKeyId || keyValue,
      keyValue,
    })

    return Response.json({ key: keyValue })
  } catch {
    return Response.json({ error: 'Failed to generate virtual key' }, { status: 500 })
  }
}