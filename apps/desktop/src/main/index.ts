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

  // Start Next.js standalone server
  try {
    serverProc = await startNextServer()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    logError('Failed to start Next.js server', e)
    dialog.showErrorBox(
      'Prism 启动失败',
      `无法启动本地服务：\n${msg}\n\n日志位置：${path.join(require('os').homedir(), '.prism', 'logs')}`,
    )
    app.quit()
    return
  }

  // Register native IPC handlers
  registerIpcHandlers()

  // Create application menu
  createAppMenu()

  // Create main window
  mainWindow = createWindow()

  // System tray
  createTray(mainWindow)

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
