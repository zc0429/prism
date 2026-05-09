import { ipcMain } from 'electron'
import { execSync, execFileSync } from 'child_process'
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import os from 'os'
import https from 'https'
import http from 'http'

const PRISM_HOME = path.join(os.homedir(), '.prism')
const NODE_INSTALL_DIR = path.join(PRISM_HOME, 'node')

function execWithTimeout(command: string, timeoutMs = 10000): string {
  return execSync(command, {
    encoding: 'utf-8',
    timeout: timeoutMs,
    windowsHide: true,
  }).trim()
}

function execFileWithTimeout(file: string, args: string[], timeoutMs = 10000): string {
  return execFileSync(file, args, {
    encoding: 'utf-8',
    timeout: timeoutMs,
    windowsHide: true,
  }).trim()
}

export function registerInstallerIpc(): void {
  // ── 环境检测 ────────────────────────────────────────────────
  ipcMain.handle('installer:check-env', async () => {
    const result = {
      ok: false,
      nodeVersion: null as string | null,
      npmVersion: null as string | null,
      npmRegistry: null as string | null,
      claudeInstalled: false,
      claudeVersion: null as string | null,
      errors: [] as string[],
    }

    try {
      result.nodeVersion = execFileWithTimeout('node', ['-v'])
    } catch {
      result.errors.push('未检测到 Node.js')
    }

    try {
      result.npmVersion = execFileWithTimeout('npm', ['-v'])
    } catch {
      result.errors.push('未检测到 npm')
    }

    try {
      result.npmRegistry = execFileWithTimeout('npm', ['config', 'get', 'registry'])
    } catch {
      // ignore
    }

    try {
      result.claudeVersion = execFileWithTimeout('claude', ['--version'])
      result.claudeInstalled = true
    } catch {
      result.claudeInstalled = false
    }

    result.ok = result.errors.length === 0 && !!result.nodeVersion
    return result
  })

  // ── 安装 Node.js（便携版自动下载）───────────────────────────
  ipcMain.handle('installer:install-node', async () => {
    const platform = process.platform
    const arch = process.arch
    const version = '22.3.0'

    let ext: string
    let filename: string
    if (platform === 'win32') {
      ext = 'zip'
      filename = `node-v${version}-win-${arch === 'x64' ? 'x64' : 'x86'}.${ext}`
    } else if (platform === 'darwin') {
      ext = 'tar.gz'
      filename = `node-v${version}-darwin-${arch === 'arm64' ? 'arm64' : 'x64'}.${ext}`
    } else {
      ext = 'tar.gz'
      filename = `node-v${version}-linux-${arch === 'arm64' ? 'arm64' : 'x64'}.${ext}`
    }

    const url = `https://nodejs.org/dist/v${version}/${filename}`
    const downloadPath = path.join(PRISM_HOME, filename)

    await fsp.mkdir(PRISM_HOME, { recursive: true })

    // Download
    await downloadFile(url, downloadPath)

    // Extract
    if (platform === 'win32') {
      // Use PowerShell to extract zip (参数化传递，避免命令注入)
      execFileSync('powershell', [
        '-command',
        'Expand-Archive',
        '-Path',
        downloadPath,
        '-DestinationPath',
        PRISM_HOME,
        '-Force',
      ], { windowsHide: true })
    } else {
      execFileSync('tar', ['-xzf', downloadPath, '-C', PRISM_HOME], { windowsHide: true })
    }

    // Move extracted folder to standard location
    const extracted = path.join(PRISM_HOME, `node-v${version}-${platform === 'win32' ? 'win' : platform}-${arch === 'arm64' ? 'arm64' : 'x64'}`)
    await fsp.rm(NODE_INSTALL_DIR, { recursive: true, force: true })
    await fsp.rename(extracted, NODE_INSTALL_DIR)

    // Cleanup
    await fsp.unlink(downloadPath).catch(() => {})

    return { success: true, path: NODE_INSTALL_DIR }
  })

  // ── 安装 Claude Code ────────────────────────────────────────
  ipcMain.handle('installer:install-claude', async () => {
    execFileSync('npm', ['install', '-g', '@anthropic-ai/claude-code'], {
      stdio: 'inherit',
      windowsHide: true,
      env: {
        ...process.env,
        NPM_CONFIG_REGISTRY: 'https://registry.npmmirror.com',
      },
    })
    return { success: true }
  })

  // ── 设置 npm 镜像源 ─────────────────────────────────────────
  ipcMain.handle('installer:set-registry', async (_event, url: string) => {
    execFileSync('npm', ['config', 'set', 'registry', url], { windowsHide: true })
    return { success: true }
  })
}

// ── 下载辅助 ──────────────────────────────────────────────────
function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http
    const file = fs.createWriteStream(dest)
    client
      .get(url, (response) => {
        if (response.statusCode === 302 && response.headers.location) {
          downloadFile(response.headers.location, dest).then(resolve).catch(reject)
          return
        }
        response.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve()
        })
      })
      .on('error', (err) => {
        fsp.unlink(dest).catch(() => {})
        reject(err)
      })
  })
}
