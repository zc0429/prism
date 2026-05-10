import { app, BrowserWindow, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { createWindow } from './window'
import { startNextServer } from './server'
import { registerIpcHandlers } from './ipc'
import { createAppMenu } from './menu'
import { createTray } from './tray'
import { autoUpdater } from 'electron-updater'
import { logInfo, logError } from './logger'

// Global error logging
process.on('uncaughtException', (err) => {
  logError('Uncaught exception', err)
  dialog.showErrorBox('Prism Error', `Unexpected error:\n${err.message}`)
  app.quit()
})

process.on('unhandledRejection', (reason) => {
  logError('Unhandled rejection', reason instanceof Error ? reason : undefined)
})

// Prevent EPIPE crash on Windows packaged app (no attached console)
process.stdout?.on('error', () => {})
process.stderr?.on('error', () => {})

let mainWindow: BrowserWindow | null = null
let serverProc: { port: number; process: import('child_process').ChildProcess } | null = null

app.whenReady().then(async () => {
  logInfo('App ready')

  // Load environment variables from monorepo root
  const envPath = path.join(__dirname, '../../../.env')
  const envProdPath = path.join(process.resourcesPath, '.env')

  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath })
    logInfo(`Loaded .env from ${envPath}`)
  } else if (fs.existsSync(envProdPath)) {
    require('dotenv').config({ path: envProdPath })
    logInfo(`Loaded .env from ${envProdPath}`)
  } else {
    logInfo('No .env file found, using process environment')
  }

  // Show window immediately with loading screen
  mainWindow = createWindow()

  // Register native IPC handlers
  registerIpcHandlers()

  // Create application menu
  createAppMenu()

  // System tray
  createTray(mainWindow)

  // Start Next.js standalone server in background
  try {
    serverProc = await startNextServer()
    logInfo(`Server ready, loading app on port ${serverProc.port}`)
    mainWindow.loadURL(`http://localhost:${serverProc.port}`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    logError('Failed to start Next.js server', e)
    const errorHtml = `data:text/html;charset=utf-8,${encodeURIComponent(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Prism</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0a0a0a;color:#e0e0e0;}.container{text-align:center;max-width:480px;padding:24px;}h1{font-size:20px;color:#f87171;}p{font-size:14px;color:#888;margin-top:12px;line-height:1.6;}code{background:#1a1a1a;padding:2px 6px;border-radius:4px;font-size:12px;}</style></head>
<body><div class="container"><h1>Prism 启动失败</h1><p>无法启动本地服务：${msg.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p><p>日志位置：${path.join(require('os').homedir(), '.prism', 'logs').replace(/\\/g,'\\\\')}</p></div></body></html>`,
    )}`
    mainWindow.loadURL(errorHtml)
    return
  }

  // Auto-update check
  autoUpdater.checkForUpdatesAndNotify().catch(() => {
    // ignore update errors in dev
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    mainWindow = createWindow()
  }
})

app.on('before-quit', () => {
  if (serverProc?.process) {
    serverProc.process.kill()
  }
})
