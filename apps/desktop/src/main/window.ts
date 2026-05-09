import { BrowserWindow } from 'electron'
import path from 'path'
import { logInfo, logError } from './logger'

export function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  })

  const url = 'http://localhost:3456'
  logInfo(`Loading window URL: ${url}`)

  win.loadURL(url)

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    logError(`Window failed to load: ${errorCode} - ${errorDescription}`)
    // Retry once after 2 seconds
    setTimeout(() => {
      logInfo('Retrying window load...')
      win.loadURL(url)
    }, 2000)
  })

  win.webContents.on('did-finish-load', () => {
    logInfo('Window loaded successfully')
  })

  win.once('ready-to-show', () => {
    win.show()
    if (process.env.NODE_ENV === 'development') {
      win.webContents.openDevTools()
    }
  })

  return win
}
