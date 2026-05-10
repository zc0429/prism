import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import http from 'http'
import fs from 'fs'
import { logInfo, logError, logWarn } from './logger'

export interface ServerProcess {
  port: number
  process: ChildProcess
}

export async function startNextServer(): Promise<ServerProcess> {
  const port = 3456
  const isDev = process.env.NODE_ENV === 'development'

  const serverCwd = isDev
    ? path.join(__dirname, '../../../web/.next/standalone')
    : path.join(process.resourcesPath, 'next-server')

  logInfo(`Starting Next.js server in ${isDev ? 'development' : 'production'} mode`)
  logInfo(`Server CWD: ${serverCwd}`)
  logInfo(`Resources path: ${process.resourcesPath}`)
  logInfo(`__dirname: ${__dirname}`)

  // ── Check path exists ─────────────────────────────────────────
  if (!fs.existsSync(serverCwd)) {
    throw new Error(`Server directory does not exist: ${serverCwd}`)
  }
  logInfo(`Server directory exists: ${serverCwd}`)

  const serverJsPath = path.join(serverCwd, 'server.js')
  if (!fs.existsSync(serverJsPath)) {
    throw new Error(`server.js not found at: ${serverJsPath}`)
  }
  logInfo(`server.js exists: ${serverJsPath}`)

  // List files in server directory for diagnostics
  try {
    const entries = fs.readdirSync(serverCwd)
    logInfo(`Server directory contents: ${entries.join(', ')}`)
  } catch (e) {
    logError('Failed to list server directory', e)
  }

  // ── Check port availability ───────────────────────────────────
  const portFree = await isPortAvailable(port)
  if (!portFree) {
    logWarn(`Port ${port} is already in use, trying to find an alternative`)
  }
  logInfo(`Port ${port} available: ${portFree}`)

  let serverProcess: ChildProcess

  if (isDev) {
    serverProcess = spawn(process.execPath, ['server.js'], {
      cwd: serverCwd,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', PORT: String(port), NODE_ENV: 'production' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    serverProcess.stdout?.on('data', (data: Buffer) => {
      logInfo(`[Next.js stdout] ${data.toString().trim()}`)
    })

    serverProcess.stdout?.on('error', () => {})

    serverProcess.stderr?.on('data', (data: Buffer) => {
      logError(`[Next.js stderr] ${data.toString().trim()}`)
    })

    serverProcess.stderr?.on('error', () => {})
  } else {
    serverProcess = spawn(process.execPath, ['server.js'], {
      cwd: serverCwd,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', PORT: String(port), NODE_ENV: 'production' },
      stdio: 'ignore',
    })
    logInfo('Spawned Next.js server with stdio: ignore')
  }

  serverProcess.on('exit', (code: number | null) => {
    logInfo(`[Next.js] Server exited with code ${code}`)
  })

  serverProcess.on('error', (err: Error) => {
    logError('[Next.js] Spawn error', err)
  })

  // ── Wait for server to be ready ───────────────────────────────
  logInfo(`Waiting for server on port ${port}...`)
  try {
    await waitForServer(port, 30000)
    logInfo(`Server ready on port ${port}`)
  } catch (e) {
    logError(`Server did not start on port ${port} within 30s`, e)
    serverProcess.kill()
    throw e
  }

  return { port, process: serverProcess }
}

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = http.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close()
      resolve(true)
    })
    server.listen(port)
  })
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
    } catch (e) {
      logInfo(`Health check failed: ${e instanceof Error ? e.message : String(e)}`)
      await new Promise((r) => setTimeout(r, 500))
    }
  }

  throw new Error(`Next.js server did not start within ${timeout}ms`)
}
