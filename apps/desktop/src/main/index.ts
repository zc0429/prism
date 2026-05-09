import { app, BrowserWindow } from 'electron'
import path from 'path'
import { createWindow } from './window'
import { startNextServer } from './server'
import { registerIpcHandlers } from './ipc'
import { createAppMenu } from './menu'
import { createTray } from './tray'
import { autoUpdater } from 'electron-updater'

// Prevent EPIPE crash on Windows packaged app (no attached console)
process.stdout?.on('error', () => {})
process.stderr?.on('error', () => {})

let mainWindow: BrowserWindow | null = null
let serverProc: { port: number; process: import('child_process').ChildProcess } | null = null

app.whenReady().then(async () => {
  // Load environment variables from monorepo root
  require('dotenv').config({ path: path.join(__dirname, '../../../.env') })

  // Start Next.js standalone server
  try {
    serverProc = await startNextServer()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to start Next.js server:', e)
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
