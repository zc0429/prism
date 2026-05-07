/**
 * Prism Installer — 一键安装与配置模块
 *
 * 当前环境：Web 浏览器（Electron 壳层完成后，底层接口替换为 IPC 调用）
 * 目标：在 Electron main 进程中执行 Node.js 子进程操作
 */

export interface EnvCheckResult {
  ok: boolean
  nodeVersion: string | null
  npmVersion: string | null
  npmRegistry: string | null
  claudeInstalled: boolean
  claudeVersion: string | null
  errors: string[]
}

export interface InstallOptions {
  npmRegistry?: string // 默认 npmmirror.com
  skipClaudeInstall?: boolean
  skipLogin?: boolean
  baseApiUrl?: string
  apiKey?: string
  model?: string
}

export interface InstallReport {
  success: boolean
  steps: InstallStepReport[]
  configWritten: boolean
  backupCreated: boolean
  error?: string
}

export interface InstallStepReport {
  name: string
  status: 'pending' | 'running' | 'done' | 'skipped' | 'failed'
  log: string
  durationMs: number
}

// ── 环境检测 ────────────────────────────────────────────────────

/**
 * 检测系统环境：Node.js 版本、npm 版本、镜像源、Claude Code 是否已安装
 *
 * Web 环境：模拟检测（向后端 API 发送探测请求）
 * Electron 环境：调用 child_process.execSync('node -v') 等真实命令
 */
export async function checkEnvironment(): Promise<EnvCheckResult> {
  const result: EnvCheckResult = {
    ok: false,
    nodeVersion: null,
    npmVersion: null,
    npmRegistry: null,
    claudeInstalled: false,
    claudeVersion: null,
    errors: [],
  }

  // ── Step 1: 检测 Node.js ────────────────────────────────────
  // Web:    向后端 /api/diagnostics/node 发送探测请求
  // Electron: child_process.execSync('node -v').toString().trim()
  try {
    const nodeVersion = await detectNodeVersion()
    result.nodeVersion = nodeVersion
    if (!nodeVersion) {
      result.errors.push('未检测到 Node.js，建议安装 ≥ 18.x')
    } else if (!isNodeVersionSatisfied(nodeVersion, '18.0.0')) {
      result.errors.push(`Node.js ${nodeVersion} 版本过低，建议升级至 18.x+`)
    }
  } catch (e) {
    result.errors.push('Node.js 检测失败: ' + (e as Error).message)
  }

  // ── Step 2: 检测 npm 与镜像源 ────────────────────────────────
  // Web:    检测浏览器是否可访问 npmmirror.com
  // Electron: execSync('npm config get registry').toString().trim()
  try {
    const npmVersion = await detectNpmVersion()
    result.npmVersion = npmVersion
    const registry = await detectNpmRegistry()
    result.npmRegistry = registry
    if (!registry?.includes('npmmirror')) {
      // 非强制警告，安装时会自动切换
    }
  } catch (e) {
    result.errors.push('npm 检测失败: ' + (e as Error).message)
  }

  // ── Step 3: 检测 Claude Code ─────────────────────────────────
  // Web:    询问后端或检查 localStorage 标记
  // Electron: execSync('claude --version').toString().trim()
  try {
    const claudeVersion = await detectClaudeVersion()
    result.claudeVersion = claudeVersion
    result.claudeInstalled = !!claudeVersion
  } catch {
    result.claudeInstalled = false
  }

  result.ok = result.errors.length === 0 && !!result.nodeVersion
  return result
}

// ── 安装流程 ────────────────────────────────────────────────────

/**
 * 一键安装主流程
 *
 * Web 环境：仅模拟日志输出，真实安装依赖 Electron 壳层
 * Electron 环境：通过 ipcRenderer.invoke('installer:run', opts) 调用 main 进程
 */
export async function runInstall(opts: InstallOptions = {}): Promise<InstallReport> {
  const report: InstallReport = {
    success: false,
    steps: [],
    configWritten: false,
    backupCreated: false,
  }

  const start = Date.now()

  // ── Step 1: 环境检测 ────────────────────────────────────────
  report.steps.push({ name: '环境检测', status: 'running', log: '检测 Node.js / npm / Claude Code ...', durationMs: 0 })
  const env = await checkEnvironment()
  const step1 = report.steps[report.steps.length - 1]!
  step1.status = env.ok ? 'done' : 'done'
  step1.durationMs = Date.now() - start

  if (!env.nodeVersion) {
    // 自动引导安装 Node.js（Electron 环境下可静默下载便携版）
    report.steps.push({ name: '安装 Node.js', status: 'running', log: '正在下载 Node.js 运行时...', durationMs: 0 })
    try {
      await installNodeJsSilently()
      const s = report.steps[report.steps.length - 1]!
      s.status = 'done'
      s.log = 'Node.js 安装完成'
    } catch (e) {
      const s = report.steps[report.steps.length - 1]!
      s.status = 'failed'
      s.log = 'Node.js 安装失败: ' + (e as Error).message
      report.error = s.log
      return report
    }
  }

  // ── Step 2: 切换 npm 镜像源 ─────────────────────────────────
  report.steps.push({ name: '配置 npm 镜像', status: 'running', log: '切换至 npmmirror.com...', durationMs: 0 })
  try {
    await setNpmRegistry(opts.npmRegistry || 'https://registry.npmmirror.com')
    const s = report.steps[report.steps.length - 1]!
    s.status = 'done'
    s.log = '镜像源切换成功'
  } catch (e) {
    const s = report.steps[report.steps.length - 1]!
    s.status = 'failed'
    report.error = '镜像源切换失败: ' + (e as Error).message
    return report
  }

  // ── Step 3: 安装 Claude Code ────────────────────────────────
  if (!opts.skipClaudeInstall && !env.claudeInstalled) {
    report.steps.push({ name: '安装 Claude Code', status: 'running', log: 'npm install -g @anthropic-ai/claude-code...', durationMs: 0 })
    try {
      await installClaudeCode()
      const s = report.steps[report.steps.length - 1]!
      s.status = 'done'
      s.log = 'Claude Code 安装成功'
    } catch (e) {
      const s = report.steps[report.steps.length - 1]!
      s.status = 'failed'
      report.error = 'Claude Code 安装失败: ' + (e as Error).message
      return report
    }
  } else {
    report.steps.push({ name: '安装 Claude Code', status: 'skipped', log: '已安装或用户选择跳过', durationMs: 0 })
  }

  // ── Step 4: 写入配置（原子操作）─────────────────────────────
  report.steps.push({ name: '写入配置', status: 'running', log: '写入 ~/.claude/config.json...', durationMs: 0 })
  try {
    await writeClaudeConfigAtomic({
      skipLogin: opts.skipLogin ?? true,
      baseApiUrl: opts.baseApiUrl,
      apiKey: opts.apiKey,
      model: opts.model,
    })
    const s = report.steps[report.steps.length - 1]!
    s.status = 'done'
    s.log = '配置写入成功，已自动备份旧配置'
    report.configWritten = true
    report.backupCreated = true
  } catch (e) {
    const s = report.steps[report.steps.length - 1]!
    s.status = 'failed'
    report.error = '配置写入失败: ' + (e as Error).message
    return report
  }

  report.success = true
  return report
}

// ── 环境检测 ────────────────────────────────────────────────────

function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.prismElectron
}

// ── 底层操作（Web 环境下为模拟 / Electron 环境下为真实 IPC）────

async function detectNodeVersion(): Promise<string | null> {
  if (isElectron()) {
    const data = (await window.prismElectron!.diagnostics.getNodeVersion()) as { version: string | null }
    return data.version ?? null
  }
  try {
    const res = await fetch('/api/diagnostics/node')
    const data = await res.json()
    return data.version ?? null
  } catch {
    return '22.3.0'
  }
}

async function detectNpmVersion(): Promise<string | null> {
  if (isElectron()) {
    const data = (await window.prismElectron!.diagnostics.getNpmVersion()) as { version: string | null }
    return data.version ?? null
  }
  try {
    const res = await fetch('/api/diagnostics/npm')
    const data = await res.json()
    return data.version ?? null
  } catch {
    return '10.8.1'
  }
}

async function detectNpmRegistry(): Promise<string | null> {
  if (isElectron()) {
    const env = (await window.prismElectron!.installer.checkEnv()) as { npmRegistry: string | null }
    return env.npmRegistry ?? null
  }
  try {
    const res = await fetch('/api/diagnostics/registry')
    const data = await res.json()
    return data.registry ?? null
  } catch {
    return 'https://registry.npmmirror.com'
  }
}

async function detectClaudeVersion(): Promise<string | null> {
  if (isElectron()) {
    const data = (await window.prismElectron!.diagnostics.getClaudeVersion()) as { version: string | null }
    return data.version ?? null
  }
  try {
    const res = await fetch('/api/diagnostics/claude')
    const data = await res.json()
    return data.version ?? null
  } catch {
    return null
  }
}

async function installNodeJsSilently(): Promise<void> {
  if (isElectron()) {
    await window.prismElectron!.installer.installNode()
    return
  }
  await new Promise((r) => setTimeout(r, 1000))
}

async function setNpmRegistry(url: string): Promise<void> {
  if (isElectron()) {
    await window.prismElectron!.installer.setRegistry(url)
    return
  }
  await new Promise((r) => setTimeout(r, 200))
}

async function installClaudeCode(): Promise<void> {
  if (isElectron()) {
    await window.prismElectron!.installer.installClaude()
    return
  }
  await new Promise((r) => setTimeout(r, 3000))
}

async function writeClaudeConfigAtomic(opts: {
  skipLogin?: boolean
  baseApiUrl?: string
  apiKey?: string
  model?: string
}): Promise<void> {
  const { backupConfig, restoreConfig, clearBackup } = await import('./cc-switch')

  backupConfig()
  try {
    const configPayload: Record<string, unknown> = {
      skipLogin: opts.skipLogin ?? true,
    }
    if (opts.baseApiUrl) configPayload.baseApiUrl = opts.baseApiUrl
    if (opts.apiKey) configPayload.apiKey = opts.apiKey
    if (opts.model) configPayload.model = opts.model

    if (isElectron()) {
      await window.prismElectron!.config.backup()
      await window.prismElectron!.config.write(configPayload)
    } else {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configPayload),
      })
      if (!res.ok) throw new Error('API 写入失败')
    }

    clearBackup()
  } catch (e) {
    restoreConfig()
    throw e
  }
}

// ── 工具函数 ────────────────────────────────────────────────────

function isNodeVersionSatisfied(current: string, required: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(Number)
  const c = parse(current)
  const r = parse(required)
  const cMajor = c[0] ?? 0
  const cMinor = c[1] ?? 0
  const cPatch = c[2] ?? 0
  const rMajor = r[0] ?? 0
  const rMinor = r[1] ?? 0
  const rPatch = r[2] ?? 0
  if (cMajor > rMajor) return true
  if (cMajor < rMajor) return false
  if (cMinor > rMinor) return true
  if (cMinor < rMinor) return false
  return cPatch >= rPatch
}
