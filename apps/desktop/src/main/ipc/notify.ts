import { ipcMain, Notification } from 'electron'

export function registerNotifyIpc(): void {
  ipcMain.handle('notify:send', async (_event, title: string, body: string) => {
    if (!Notification.isSupported()) {
      return { sent: false, reason: 'Notifications not supported' }
    }

    const notification = new Notification({
      title,
      body,
      silent: false,
    })

    notification.show()
    return { sent: true }
  })
}
