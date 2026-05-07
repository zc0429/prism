export interface ToolConfig {
  configPath: string
  configContent: string
  envVars: Record<string, string>
  installCmd?: string
  instructions: string[]
}
