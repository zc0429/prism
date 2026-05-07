'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Cpu,
  Check,
  AlertCircle,
  Settings,
  Loader2,
  Zap,
  Coins,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCostEstimate } from '@/lib/pricing'

interface Model {
  id: string
  name: string
  provider: string
  baseUrl: string
  inputPrice: string
  outputPrice: string
  region: 'domestic' | 'international'
}

interface ApiKeyEntry {
  id: string
  provider: string
  keyHint: string
  label: string | null
  isActive: boolean
}

interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error'
}

const models: Model[] = [
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com',
    inputPrice: '¥0.001/1K',
    outputPrice: '¥0.002/1K',
    region: 'domestic',
  },
  {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com',
    inputPrice: '¥0.001/1K',
    outputPrice: '¥0.002/1K',
    region: 'domestic',
  },
  {
    id: 'qwen-turbo',
    name: 'Qwen Turbo',
    provider: 'alibaba',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    inputPrice: '¥0.0005/1K',
    outputPrice: '¥0.001/1K',
    region: 'domestic',
  },
  {
    id: 'qwen-plus',
    name: 'Qwen Plus',
    provider: 'alibaba',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    inputPrice: '¥0.002/1K',
    outputPrice: '¥0.006/1K',
    region: 'domestic',
  },
  {
    id: 'glm-4',
    name: 'GLM-4',
    provider: 'zhipu',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    inputPrice: '¥0.001/1K',
    outputPrice: '¥0.001/1K',
    region: 'domestic',
  },
  {
    id: 'moonshot-v1',
    name: 'Moonshot V1',
    provider: 'moonshot',
    baseUrl: 'https://api.moonshot.cn/v1',
    inputPrice: '¥0.001/1K',
    outputPrice: '¥0.001/1K',
    region: 'domestic',
  },
  {
    id: 'yi-large',
    name: 'Yi Large',
    provider: '01ai',
    baseUrl: 'https://api.lingyiwanwu.com/v1',
    inputPrice: '¥0.002/1K',
    outputPrice: '¥0.002/1K',
    region: 'domestic',
  },
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    inputPrice: '$3/1M',
    outputPrice: '$15/1M',
    region: 'international',
  },
  {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    inputPrice: '$15/1M',
    outputPrice: '$75/1M',
    region: 'international',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    inputPrice: '$5/1M',
    outputPrice: '$15/1M',
    region: 'international',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    inputPrice: '$0.15/1M',
    outputPrice: '$0.6/1M',
    region: 'international',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    baseUrl: 'https://generativelanguage.googleapis.com',
    inputPrice: '$0.15/1M',
    outputPrice: '$0.6/1M',
    region: 'international',
  },
]

const allProviders = Array.from(new Set(models.map((m) => m.provider)))

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const ToastContainer = useCallback(
    () => (
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg',
              t.type === 'success'
                ? 'border-border bg-card text-foreground'
                : 'border-destructive bg-destructive/10 text-destructive'
            )}
          >
            {t.type === 'success' ? (
              <Check className="size-4 text-primary" />
            ) : (
              <AlertCircle className="size-4" />
            )}
            <span className="text-sm font-medium">{t.message}</span>
          </div>
        ))}
      </div>
    ),
    [toasts]
  )

  return { addToast, ToastContainer }
}

export default function ModelsPage() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [baseUrls, setBaseUrls] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const m of models) {
      map[m.id] = m.baseUrl
    }
    return map
  })
  const [testingIds, setTestingIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState('domestic')
  const [providerFilter, setProviderFilter] = useState<string>('all')
  const { addToast, ToastContainer } = useToast()

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/keys')
      const json = await res.json()
      if (json.data) setKeys(json.data)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const hasKeyForProvider = useCallback(
    (provider: string) => {
      return keys.some((k) => k.provider === provider && k.isActive)
    },
    [keys]
  )

  const selectedModel = useMemo(
    () => models.find((m) => m.id === selectedModelId) ?? null,
    [selectedModelId]
  )

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      if (m.region !== activeTab) return false
      if (providerFilter !== 'all' && m.provider !== providerFilter)
        return false
      return true
    })
  }, [activeTab, providerFilter])

  const handleTestConnection = useCallback(
    async (model: Model) => {
      if (!hasKeyForProvider(model.provider)) {
        addToast(`${model.name} 需要配置 API Key`, 'error')
        return
      }
      setTestingIds((prev) => new Set(prev).add(model.id))
      try {
        const res = await fetch('/api/config/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            baseUrl: baseUrls[model.id],
            provider: model.provider,
          }),
        })
        const data = await res.json()
        if (data.success) {
          addToast(`${model.name} 连接成功 (${data.latency}ms)`, 'success')
        } else {
          addToast(`${model.name} 连接失败: ${data.error ?? '未知错误'}`, 'error')
        }
      } catch {
        addToast(`${model.name} 连接失败`, 'error')
      } finally {
        setTestingIds((prev) => {
          const next = new Set(prev)
          next.delete(model.id)
          return next
        })
      }
    },
    [addToast, baseUrls, hasKeyForProvider]
  )

  const handleApplyConfig = useCallback(async () => {
    if (!selectedModel) return
    const payload = {
      defaultModel: selectedModel.id,
      baseUrl: baseUrls[selectedModel.id] ?? selectedModel.baseUrl,
      provider: selectedModel.provider,
      appliedAt: new Date().toISOString(),
    }
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        addToast('配置已应用', 'success')
      } else {
        addToast('配置保存失败', 'error')
      }
    } catch {
      addToast('配置保存失败', 'error')
    }
  }, [addToast, selectedModel, baseUrls])

  return (
    <div className="space-y-6">
      <ToastContainer />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          模型管理
        </h1>
        <Settings className="size-5 text-muted-foreground" />
      </div>

      {selectedModel && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Cpu className="size-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  当前选中：{selectedModel.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedModel.provider} · {selectedModel.inputPrice} 输入 /{' '}
                  {selectedModel.outputPrice} 输出
                </p>
              </div>
            </div>
            <Button size="sm" onClick={handleApplyConfig}>
              <Zap className="size-3.5" />
              应用配置
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-secondary">
            <TabsTrigger
              value="domestic"
              className="data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              国产模型
            </TabsTrigger>
            <TabsTrigger
              value="international"
              className="data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              国外模型
            </TabsTrigger>
          </TabsList>

          <Select value={providerFilter} onValueChange={(v) => setProviderFilter(v ?? 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="全部提供商" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部提供商</SelectItem>
              {allProviders.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="domestic" className="mt-4">
          <ModelGrid
            models={filteredModels}
            selectedModelId={selectedModelId}
            onSelect={setSelectedModelId}
            baseUrls={baseUrls}
            onBaseUrlChange={(id, url) =>
              setBaseUrls((prev) => ({ ...prev, [id]: url }))
            }
            testingIds={testingIds}
            onTest={handleTestConnection}
            hasKeyForProvider={hasKeyForProvider}
          />
        </TabsContent>

        <TabsContent value="international" className="mt-4">
          <ModelGrid
            models={filteredModels}
            selectedModelId={selectedModelId}
            onSelect={setSelectedModelId}
            baseUrls={baseUrls}
            onBaseUrlChange={(id, url) =>
              setBaseUrls((prev) => ({ ...prev, [id]: url }))
            }
            testingIds={testingIds}
            onTest={handleTestConnection}
            hasKeyForProvider={hasKeyForProvider}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ModelGrid({
  models,
  selectedModelId,
  onSelect,
  baseUrls,
  onBaseUrlChange,
  testingIds,
  onTest,
  hasKeyForProvider,
}: {
  models: Model[]
  selectedModelId: string | null
  onSelect: (id: string) => void
  baseUrls: Record<string, string>
  onBaseUrlChange: (id: string, url: string) => void
  testingIds: Set<string>
  onTest: (model: Model) => void
  hasKeyForProvider: (provider: string) => boolean
}) {
  if (models.length === 0) {
    return (
      <Card className="flex items-center justify-center min-h-[200px]">
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <Cpu className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">暂无模型</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {models.map((model) => {
        const isSelected = selectedModelId === model.id
        const isTesting = testingIds.has(model.id)
        const hasKey = hasKeyForProvider(model.provider)

        return (
          <Card
            key={model.id}
            className={cn(
              'cursor-pointer transition-all',
              isSelected
                ? 'border-primary shadow-sm'
                : 'border-border hover:border-primary/50'
            )}
            onClick={() => onSelect(model.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">{model.name}</CardTitle>
                <Badge variant="secondary" className="capitalize">
                  {model.provider}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {!hasKey && (
                <div className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>该模型需要配置 API Key</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">输入价格</p>
                  <p className="font-medium text-foreground">
                    {model.inputPrice}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">输出价格</p>
                  <p className="font-medium text-foreground">
                    {model.outputPrice}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 rounded-md bg-primary/5 px-2.5 py-1.5 text-xs text-primary">
                <Coins className="size-3.5 shrink-0" />
                <span>{getCostEstimate(model.inputPrice, model.outputPrice)}</span>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Base URL</p>
                <Input
                  value={baseUrls[model.id] ?? model.baseUrl}
                  onChange={(e) => onBaseUrlChange(model.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-border text-foreground hover:bg-secondary"
                  disabled={isTesting}
                  onClick={(e) => {
                    e.stopPropagation()
                    onTest(model)
                  }}
                >
                  {isTesting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Zap className="size-3.5" />
                  )}
                  {isTesting ? '测试中...' : '测试连接'}
                </Button>
                <Button
                  size="sm"
                  variant={isSelected ? 'default' : 'outline'}
                  className={
                    isSelected
                      ? ''
                      : 'border-border text-foreground hover:bg-secondary'
                  }
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect(model.id)
                  }}
                >
                  {isSelected ? (
                    <>
                      <Check className="size-3.5" />
                      已选择
                    </>
                  ) : (
                    '选择'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
