import { ipcMain } from 'electron'
import { execSync } from 'child_process'
import https from 'https'
import http from 'http'

export function registerDiagnosticsIpc(): void {
  // ── 系统代理检测 ────────────────────────────────────────────
  ipcMain.handle('diag:proxy', async () => {
    return {
      hasProxy: !!(process.env.HTTP_PROXY || process.env.HTTPS_PROXY),
      httpProxy: process.env.HTTP_PROXY || undefined,
      httpsProxy: process.env.HTTPS_PROXY || undefined,
      noProxy: process.env.NO_PROXY || undefined,
    }
  })

  // ── Node.js 版本 ────────────────────────────────────────────
  ipcMain.handle('diag:node-version', async () => {
    try {
      return { version: execSync('node -v', { encoding: 'utf-8', windowsHide: true }).trim() }
    } catch {
      return { version: null }
    }
  })

  // ── npm 版本 ────────────────────────────────────────────────
  ipcMain.handle('diag:npm-version', async () => {
    try {
      return { version: execSync('npm -v', { encoding: 'utf-8', windowsHide: true }).trim() }
    } catch {
      return { version: null }
    }
  })

  // ── Claude Code 版本 ────────────────────────────────────────
  ipcMain.handle('diag:claude-version', async () => {
    try {
      return { version: execSync('claude --version', { encoding: 'utf-8', windowsHide: true }).trim() }
    } catch {
      return { version: null }
    }
  })

  // ── Ping 延迟 ───────────────────────────────────────────────
  ipcMain.handle('diag:ping', async (_event, host: string) => {
    const start = Date.now()
    try {
      await new Promise<void>((resolve, reject) => {
        const client = host.startsWith('https:') ? https : http
        const req = client.get(host, { timeout: 5000 }, (res) => {
          resolve()
        })
        req.on('error', reject)
        req.on('timeout', () => {
          req.destroy()
          reject(new Error('Timeout'))
        })
      })
      return { ok: true, latencyMs: Date.now() - start }
    } catch (e) {
      return { ok: false, latencyMs: Date.now() - start, error: (e as Error).message }
    }
  })
}
