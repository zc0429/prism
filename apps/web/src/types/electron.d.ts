export {}

declare global {
  interface Window {
    prismElectron?: {
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
  }
}
