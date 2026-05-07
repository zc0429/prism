/**
 * ProviderAdapter — 中转站供应商适配器接口
 *
 * 设计原则：
 * 1. Prism 不自建大模型转发服务，底层协议转换完全依赖第三方中转站
 * 2. 预留多供应商热切换能力：Provider A 故障时自动切换到 Provider B
 * 3. 当前 MVP 仅接入 LiteLLM，后续可无缝扩展
 */

export interface ProviderCredentials {
  baseUrl: string
  apiKey: string
}

export interface ProviderHealth {
  ok: boolean
  latencyMs: number
  error?: string
  providerId: string
}

export interface ChatRequest {
  model: string
  messages: Array<{ role: string; content: string }>
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface ChatResponse {
  id: string
  model: string
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface ModelInfo {
  id: string
  name: string
  provider: string
  inputPricePer1K: number // 人民币
  outputPricePer1K: number // 人民币
  maxTokens: number
  contextWindow: number
}

/**
 * 供应商适配器抽象接口
 * 每个新供应商只需实现此接口即可接入 Prism
 */
export interface ProviderAdapter {
  /** 供应商唯一标识 */
  readonly id: string
  /** 供应商显示名称 */
  readonly name: string
  /** 支持的模型列表 */
  listModels(): Promise<ModelInfo[]>
  /** 健康检查：探测供应商可用性 */
  healthCheck(): Promise<ProviderHealth>
  /** 发起对话请求 */
  chat(req: ChatRequest, creds: ProviderCredentials): Promise<ChatResponse>
  /** 生成子密钥（用于充值扣费模式） */
  generateSubKey?(
    creds: ProviderCredentials,
    options: { budgetLimit?: number; alias?: string }
  ): Promise<{ keyId: string; keyValue: string; expiresAt?: Date }>
  /** 查询子密钥用量 */
  getSubKeyUsage?(
    creds: ProviderCredentials,
    keyId: string
  ): Promise<{ usedTokens: number; usedCost: number; remainingBudget?: number }>
}

// ── LiteLLM MVP 实现 ────────────────────────────────────────────

export class LiteLLMAdapter implements ProviderAdapter {
  readonly id = 'litellm'
  readonly name = 'LiteLLM Gateway'

  async listModels(): Promise<ModelInfo[]> {
    // 当前从本地静态列表返回，后续可调用 LiteLLM /models 端点
    return [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        provider: 'deepseek',
        inputPricePer1K: 0.001,
        outputPricePer1K: 0.002,
        maxTokens: 8192,
        contextWindow: 65536,
      },
      {
        id: 'qwen-turbo',
        name: 'Qwen Turbo',
        provider: 'alibaba',
        inputPricePer1K: 0.0005,
        outputPricePer1K: 0.001,
        maxTokens: 8192,
        contextWindow: 131072,
      },
      {
        id: 'glm-4',
        name: 'GLM-4',
        provider: 'zhipu',
        inputPricePer1K: 0.001,
        outputPricePer1K: 0.001,
        maxTokens: 8192,
        contextWindow: 131072,
      },
      {
        id: 'moonshot-v1',
        name: 'Moonshot V1',
        provider: 'moonshot',
        inputPricePer1K: 0.001,
        outputPricePer1K: 0.001,
        maxTokens: 8192,
        contextWindow: 131072,
      },
    ]
  }

  async healthCheck(): Promise<ProviderHealth> {
    const gatewayUrl = process.env.LITELLM_GATEWAY_URL ?? 'http://localhost:4000'
    const start = Date.now()
    try {
      const res = await fetch(`${gatewayUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      })
      return {
        ok: res.ok,
        latencyMs: Date.now() - start,
        providerId: this.id,
      }
    } catch (e) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: (e as Error).message,
        providerId: this.id,
      }
    }
  }

  async chat(req: ChatRequest, creds: ProviderCredentials): Promise<ChatResponse> {
    const res = await fetch(`${creds.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creds.apiKey}`,
      },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens,
        stream: req.stream ?? false,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`LiteLLM chat failed: ${res.status} ${err}`)
    }

    const data = await res.json()
    return {
      id: data.id,
      model: data.model,
      content: data.choices?.[0]?.message?.content ?? '',
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    }
  }

  async generateSubKey(
    creds: ProviderCredentials,
    options: { budgetLimit?: number; alias?: string } = {}
  ): Promise<{ keyId: string; keyValue: string; expiresAt?: Date }> {
    const res = await fetch(`${creds.baseUrl}/key/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creds.apiKey}`,
      },
      body: JSON.stringify({
        budget: options.budgetLimit,
        alias: options.alias,
      }),
    })

    if (!res.ok) {
      throw new Error('Failed to generate sub-key from LiteLLM')
    }

    const data = await res.json()
    return {
      keyId: data.key?.key_id ?? data.key?.id ?? '',
      keyValue: data.key?.key ?? data.key?.token ?? '',
      expiresAt: data.key?.expires ? new Date(data.key.expires) : undefined,
    }
  }
}

// ── 多供应商管理器（热切换预留）─────────────────────────────────

export class ProviderManager {
  private adapters: Map<string, ProviderAdapter> = new Map()
  private activeId: string | null = null

  register(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.id, adapter)
    if (!this.activeId) {
      this.activeId = adapter.id
    }
  }

  get(id: string): ProviderAdapter | undefined {
    return this.adapters.get(id)
  }

  getActive(): ProviderAdapter | undefined {
    return this.activeId ? this.adapters.get(this.activeId) : undefined
  }

  setActive(id: string): boolean {
    if (this.adapters.has(id)) {
      this.activeId = id
      return true
    }
    return false
  }

  list(): ProviderAdapter[] {
    return Array.from(this.adapters.values())
  }

  /** 探测所有供应商健康状态，返回最优节点 */
  async probeAll(): Promise<ProviderHealth[]> {
    const checks = await Promise.all(
      this.list().map((a) => a.healthCheck().catch(() => ({ ok: false, latencyMs: Infinity, providerId: a.id })))
    )
    return checks.sort((a, b) => a.latencyMs - b.latencyMs)
  }

  /** 自动切换到最优可用供应商 */
  async autoSwitch(): Promise<ProviderAdapter | null> {
    const results = await this.probeAll()
    const best = results.find((r) => r.ok)
    if (best && best.providerId !== this.activeId) {
      this.setActive(best.providerId)
      return this.getActive() ?? null
    }
    return this.getActive() ?? null
  }
}

// ── 单例导出 ────────────────────────────────────────────────────

export const providerManager = new ProviderManager()
providerManager.register(new LiteLLMAdapter())
