import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import http from 'http'

export interface ServerProcess {
  port: number
  process: ChildProcess
}

/** Safe logger that won't crash on missing stdout (packaged Windows GUI) */
function safeLog(...args: unknown[]): void {
  try {
    console.log(...args)
  } catch {
    // ignore EPIPE in packaged app
  }
}

function safeError(...args: unknown[]): void {
  try {
    console.error(...args)
  } catch {
    // ignore EPIPE in packaged app
  }
}

export async function startNextServer(): Promise<ServerProcess> {
  const port = 3456

  const serverCwd =
    process.env.NODE_ENV === 'development'
      ? path.join(__dirname, '../../../web/.next/standalone')
      : path.join(process.resourcesPath, 'next-server')

  const serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: serverCwd,
    env: { ...process.env, PORT: String(port), NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  serverProcess.stdout?.on('data', (data: Buffer) => {
    safeLog('[Next.js]', data.toString().trim())
  })

  serverProcess.stdout?.on('error', () => {
    // stdout pipe broken — ignore
  })

  serverProcess.stderr?.on('data', (data: Buffer) => {
    safeError('[Next.js]', data.toString().trim())
  })

  serverProcess.stderr?.on('error', () => {
    // stderr pipe broken — ignore
  })

  serverProcess.on('exit', (code) => {
    safeLog(`[Next.js] Server exited with code ${code}`)
  })

  serverProcess.on('error', (err) => {
    safeError('[Next.js] Spawn error:', err.message)
  })

  // Wait for server to be ready
  await waitForServer(port, 30000)

  return { port, process: serverProcess }
}

async function waitForServer(port: number, timeout: number): Promise<void> {
  const start = Date.now()

  while (Date.now() - start < timeout) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(`http://localhost:${port}/api/health`, (res) => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
            resolve()
          } else {
            reject(new Error(`Status ${res.statusCode}`))
          }
        })
        req.on('error', reject)
        req.setTimeout(1000, () => {
          req.destroy()
          reject(new Error('Timeout'))
        })
      })
      return
    } catch {
      await new Promise((r) => setTimeout(r, 500))
    }
  }

  throw new Error(`Next.js server did not start within ${timeout}ms`)
}
