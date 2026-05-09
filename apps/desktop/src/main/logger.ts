import fs from 'fs'
import path from 'path'
import os from 'os'

const LOG_DIR = path.join(os.homedir(), '.prism', 'logs')
const LOG_FILE = path.join(LOG_DIR, `main-${new Date().toISOString().slice(0, 10)}.log`)

function ensureLogDir(): void {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true })
  } catch {
    // ignore
  }
}

export function logToFile(message: string): void {
  ensureLogDir()
  const line = `[${new Date().toISOString()}] ${message}\n`
  try {
    fs.appendFileSync(LOG_FILE, line)
  } catch {
    // ignore
  }
}

export function logError(message: string, err?: unknown): void {
  const detail = err instanceof Error ? ` | ${err.message}\n${err.stack ?? ''}` : ''
  logToFile(`[ERROR] ${message}${detail}`)
}

export function logInfo(message: string): void {
  logToFile(`[INFO] ${message}`)
}

export function logWarn(message: string): void {
  logToFile(`[WARN] ${message}`)
}
