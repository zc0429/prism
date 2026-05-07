import { ipcMain } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

const CLAUDE_CONFIG_DIR = path.join(os.homedir(), '.claude')
const CLAUDE_CONFIG_PATH = path.join(CLAUDE_CONFIG_DIR, 'config.json')
const CLAUDE_CONFIG_BACKUP = path.join(CLAUDE_CONFIG_DIR, 'config.json.backup')

async function ensureConfigDir(): Promise<void> {
  await fs.mkdir(CLAUDE_CONFIG_DIR, { recursive: true })
}

export function registerConfigIpc(): void {
  ipcMain.handle('config:read', async () => {
    try {
      const data = await fs.readFile(CLAUDE_CONFIG_PATH, 'utf-8')
      return JSON.parse(data)
    } catch {
      return null
    }
  })

  ipcMain.handle('config:write', async (_event, config: object) => {
    await ensureConfigDir()
    await fs.writeFile(
      CLAUDE_CONFIG_PATH,
      JSON.stringify(config, null, 2),
      'utf-8',
    )
    return true
  })

  ipcMain.handle('config:backup', async () => {
    try {
      const data = await fs.readFile(CLAUDE_CONFIG_PATH, 'utf-8')
      await fs.writeFile(CLAUDE_CONFIG_BACKUP, data, 'utf-8')
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('config:restore', async () => {
    try {
      const data = await fs.readFile(CLAUDE_CONFIG_BACKUP, 'utf-8')
      await fs.writeFile(CLAUDE_CONFIG_PATH, data, 'utf-8')
      return true
    } catch {
      return false
    }
  })
}
