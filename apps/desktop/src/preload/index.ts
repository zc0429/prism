import { contextBridge, ipcRenderer } from 'electron'

export interface PrismElectronAPI {
  platform: string
  config: {
    read: () => Promise<unknown>
    write: (config: object) => Promise<boolean>
    backup: () => Promise<boolean>
    restore: () => Promise<boolean>
  }
  installer: {
    checkEnv: () => Promise<unknown>
    installNode: () => Promise<unknown>
    installClaude: () => Promise<unknown>
    setRegistry: (url: string) => Promise<unknown>
  }
  diagnostics: {
    getProxy: () => Promise<unknown>
    getNodeVersion: () => Promise<unknown>
    getNpmVersion: () => Promise<unknown>
    getClaudeVersion: () => Promise<unknown>
    ping: (host: string) => Promise<unknown>
  }
  notify: {
    send: (title: string, body: string) => Promise<{ sent: boolean; reason?: string }>
  }
}

const api: PrismElectronAPI = {
  platform: process.platform,

  config: {
    read: () => ipcRenderer.invoke('config:read'),
    write: (config: object) => ipcRenderer.invoke('config:write', config),
    backup: () => ipcRenderer.invoke('config:backup'),
    restore: () => ipcRenderer.invoke('config:restore'),
  },

  installer: {
    checkEnv: () => ipcRenderer.invoke('installer:check-env'),
    installNode: () => ipcRenderer.invoke('installer:install-node'),
    installClaude: () => ipcRenderer.invoke('installer:install-claude'),
    setRegistry: (url: string) => ipcRenderer.invoke('installer:set-registry', url),
  },

  diagnostics: {
    getProxy: () => ipcRenderer.invoke('diag:proxy'),
    getNodeVersion: () => ipcRenderer.invoke('diag:node-version'),
    getNpmVersion: () => ipcRenderer.invoke('diag:npm-version'),
    getClaudeVersion: () => ipcRenderer.invoke('diag:claude-version'),
    ping: (host: string) => ipcRenderer.invoke('diag:ping', host),
  },

  notify: {
    send: (title: string, body: string) => ipcRenderer.invoke('notify:send', title, body),
  },
}

contextBridge.exposeInMainWorld('prismElectron', api)
