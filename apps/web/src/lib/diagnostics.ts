/**
 * Prism Diagnostics — 系统诊断工具
 *
 * 检测项：
 * 1. 系统代理检测（HTTP_PROXY / HTTPS_PROXY）
 * 2. HTTPS 证书连通性测试（到中转站 API）
 * 3. npm 镜像源延迟
 * 4. Claude Code 配置文件状态
 */

export interface ProxyInfo {
  hasProxy: boolean
  httpProxy?: string
  httpsProxy?: string
  noProxy?: string
}

export interface CertTestResult {
  host: string
  ok: boolean
  latencyMs: number
  error?: string
}

export interface DiagnosticReport {
  proxy: ProxyInfo
  certTests: CertTestResult[]
  npmRegistryLatency: number
  configFileStatus: 'ok' | 'missing' | 'unreadable'
  timestamp: string
}

// ── 环境检测 ────────────────────────────────────────────────────

function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.prismElectron
}

// ── 代理检测 ────────────────────────────────────────────────────

/**
 * 检测系统代理设置
 *
 * Web 环境：无法直接读取系统环境变量，通过 fetch 行为推断
 * Electron 环境：ipcRenderer.invoke('diagnostics:proxy') 读取 process.env
 */
export async function detectProxy(): Promise<ProxyInfo> {
  if (isElectron()) {
    return (await window.prismElectron!.diagnostics.getProxy()) as ProxyInfo
  }

  const info: ProxyInfo = { hasProxy: false }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const start = performance.now()
    await fetch('https://registry.npmmirror.com', {
      mode: 'no-cors',
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const latency = performance.now() - start
    if (latency > 800) {
      info.hasProxy = true
    }
  } catch {
    // ignore
  }
  return info
}

// ── HTTPS 证书连通性测试 ───────────────────────────────────────

const CERT_TEST_TARGETS = [
  { host: 'https://api.openai.com', name: 'OpenAI API' },
  { host: 'https://api.anthropic.com', name: 'Anthropic API' },
  { host: 'https://api.deepseek.com', name: 'DeepSeek API' },
  { host: 'https://registry.npmmirror.com', name: 'npm 国内镜像' },
]

export async function testCertConnectivity(): Promise<CertTestResult[]> {
  const results: CertTestResult[] = []

  for (const target of CERT_TEST_TARGETS) {
    const start = performance.now()
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      await fetch(target.host, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      })
      clearTimeout(timeout)
      results.push({
        host: target.name,
        ok: true,
        latencyMs: Math.round(performance.now() - start),
      })
    } catch (e) {
      results.push({
        host: target.name,
        ok: false,
        latencyMs: Math.round(performance.now() - start),
        error: (e as Error).message,
      })
    }
  }

  return results
}

// ── npm 镜像延迟 ────────────────────────────────────────────────

export async function testNpmRegistryLatency(registry = 'https://registry.npmmirror.com'): Promise<number> {
  if (isElectron()) {
    const result = (await window.prismElectron!.diagnostics.ping(registry)) as { ok: boolean; latencyMs: number }
    return result.ok ? result.latencyMs : -1
  }
  const start = performance.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    await fetch(registry, { mode: 'no-cors', signal: controller.signal })
    clearTimeout(timeout)
    return Math.round(performance.now() - start)
  } catch {
    return -1
  }
}

// ── 配置文件状态 ────────────────────────────────────────────────

export async function checkConfigFileStatus(): Promise<'ok' | 'missing' | 'unreadable'> {
  if (isElectron()) {
    try {
      const data = await window.prismElectron!.config.read()
      return data ? 'ok' : 'missing'
    } catch {
      return 'unreadable'
    }
  }
  try {
    const hasConfig = localStorage.getItem('prism-claude-config')
    return hasConfig ? 'ok' : 'missing'
  } catch {
    return 'unreadable'
  }
}

// ── 综合诊断报告 ────────────────────────────────────────────────

export async function runFullDiagnostics(): Promise<DiagnosticReport> {
  const [proxy, certTests, npmLatency, configStatus] = await Promise.all([
    detectProxy(),
    testCertConnectivity(),
    testNpmRegistryLatency(),
    checkConfigFileStatus(),
  ])

  return {
    proxy,
    certTests,
    npmRegistryLatency: npmLatency,
    configFileStatus: configStatus,
    timestamp: new Date().toISOString(),
  }
}

// ── 诊断摘要（用于 UI 展示）────────────────────────────────────

export function summarizeDiagnostics(report: DiagnosticReport): {
  overall: 'healthy' | 'warning' | 'critical'
  issues: string[]
} {
  const issues: string[] = []

  if (report.proxy.hasProxy) {
    issues.push('检测到系统代理，可能会影响 npm 安装速度，建议配置代理白名单')
  }

  const failedCerts = report.certTests.filter((t) => !t.ok)
  if (failedCerts.length > 0) {
    issues.push(`HTTPS 证书检测失败: ${failedCerts.map((f) => f.host).join('、')} — 请检查系统时间、代理或防火墙设置`)
  }

  if (report.npmRegistryLatency < 0) {
    issues.push('npm 国内镜像无法访问，请检查网络连接')
  } else if (report.npmRegistryLatency > 2000) {
    issues.push(`npm 镜像延迟较高 (${report.npmRegistryLatency}ms)，建议使用代理加速`)
  }

  if (report.configFileStatus === 'unreadable') {
    issues.push('配置文件读取异常，请检查文件权限')
  }

  const overall =
    issues.length === 0
      ? 'healthy'
      : failedCerts.length > 0
        ? 'critical'
        : 'warning'

  return { overall, issues }
}
