export interface CommandStep {
  label: string
  command: string
  osCommands?: {
    windows: string
    macos: string
    linux: string
  }
}

export interface ToolGuide {
  id: string
  name: string
  icon: string
  providers: string[]
  byok: {
    label: string
    steps: (apiKey: string) => CommandStep[]
  }
  platform: {
    label: string
    steps: (endpoint: string, token: string) => CommandStep[]
  }
}