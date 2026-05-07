/**
 * Client-side encryption using Web Crypto API (AES-256-GCM)
 *
 * Uses a fixed derivation password based on origin + salt.
 * This is NOT as secure as server-side encryption but protects
 * against casual localStorage inspection and XSS scraping.
 */

const SALT = 'prism-client-v1-salt'
const ALGORITHM = 'AES-GCM'
const IV_LENGTH = 12

async function deriveKey(): Promise<CryptoKey> {
  const password = `${window.location.origin}:${SALT}`
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptClient(plaintext: string): Promise<string> {
  const key = await deriveKey()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoder = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext),
  )
  const combined = new Uint8Array(iv.length + (ciphertext as ArrayBuffer).byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext as ArrayBuffer), iv.length)
  return btoa(String.fromCharCode(...combined))
}

export async function decryptClient(encrypted: string): Promise<string> {
  const key = await deriveKey()
  const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, IV_LENGTH)
  const ciphertext = combined.slice(IV_LENGTH)
  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext,
  )
  return new TextDecoder().decode(plaintext)
}
