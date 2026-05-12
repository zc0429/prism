import { Tray, Menu, BrowserWindow, app, nativeTheme, nativeImage } from 'electron'
import path from 'path'

let tray: Tray | null = null

export function createTray(mainWindow: BrowserWindow): void {
  const isDark = nativeTheme.shouldUseDarkColors
  const iconPath = path.join(
    __dirname,
    isDark && process.platform === 'darwin'
      ? '../../build/tray@dark.png'
      : '../../build/tray.png'
  )

  const image = nativeImage.createFromPath(iconPath)
  if (image.isEmpty()) {
    return // icon not available, skip tray
  }

  tray = new Tray(image)

  // Listen for theme changes on macOS
  if (process.platform === 'darwin') {
    nativeTheme.on('updated', () => {
      if (!tray) return
      const dark = nativeTheme.shouldUseDarkColors
      const newPath = path.join(
        __dirname,
        dark ? '../../build/tray@dark.png' : '../../build/tray.png'
      )
      const newImage = nativeImage.createFromPath(newPath)
      if (!newImage.isEmpty()) {
        tray.setImage(newImage)
      }
    })
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示 Prism',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      },
    },
    {
      label: '隐藏',
      click: () => {
        mainWindow.hide()
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setToolTip('Prism')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

export function getTray(): Tray | null {
  return tray
}
