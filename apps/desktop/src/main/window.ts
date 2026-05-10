import { BrowserWindow } from 'electron'
import path from 'path'
import { logInfo, logError } from './logger'

const LOADING_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Prism</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0a0a0a; color: #e0e0e0; }
  .spinner { width: 32px; height: 32px; border: 3px solid #333; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .container { text-align: center; }
  .text { margin-top: 16px; font-size: 14px; color: #888; }
</style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <div class="text">Prism 正在启动...</div>
  </div>
</body>
</html>`

export function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  })

  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(LOADING_HTML)}`)

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    if (validatedURL.startsWith('data:')) return
    logError(`Window failed to load: ${errorCode} - ${errorDescription}`)
  })

  win.webContents.on('did-finish-load', () => {
    logInfo('Window loaded successfully')
  })

  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools()
  }

  return win
}
