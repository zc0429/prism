import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
  }
  return Buffer.from(key, 'hex')
}

export function encryptApiKey(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // format: iv + tag + ciphertext, all as hex
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted.toString('hex')
}

export function decryptApiKey(encrypted: string): string {
  const key = getKey()
  const [ivHex, tagHex, dataHex] = encrypted.split(':') as [string, string, string]
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const data = Buffer.from(dataHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(data, undefined, 'utf8') + decipher.final('utf8')
}

export function keyHint(apiKey: string): string {
  if (apiKey.length <= 8) return apiKey.slice(0, 3) + '...'
  return apiKey.slice(0, 3) + '...' + apiKey.slice(-4)
}
