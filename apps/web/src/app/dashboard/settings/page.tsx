'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Key, Shield, Trash2, Bell, Mail, FileJson, Eye } from 'lucide-react'

interface ApiKeyEntry {
  id: string
  provider: string
  keyHint: string
  label: string | null
  isActive: boolean
}

interface AlertSettings {
  threshold: number
  enabled: boolean
}

const providers = ['anthropic', 'openai', 'google', 'deepseek'] as const

const inputClass = 'h-11 bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20'

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([])
  const [provider, setProvider] = useState<string>('anthropic')
  const [apiKey, setApiKey] = useState('')
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(false)

  const [alertSettings, setAlertSettings] = useState<AlertSettings>({ threshold: 50, enabled: true })
  const [alertLoading, setAlertLoading] = useState(false)
  const [alertSaved, setAlertSaved] = useState(false)

  const [claudeConfig, setClaudeConfig] = useState<Record<string, unknown> | null>(null)
  const [configJsonText, setConfigJsonText] = useState('')
  const [configMode, setConfigMode] = useState<'visual' | 'json'>('visual')
  const [configLoading, setConfigLoading] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)
  const [configError, setConfigError] = useState('')

  const fetchKeys = useCallback(async () => {
    const res = await fetch('/api/keys')
    const json = await res.json()
    if (json.data) setKeys(json.data)
  }, [])

  const fetchAlertSettings = useCallback(async () => {
    const res = await fetch('/api/alerts/settings')
    if (res.ok) {
      const json = await res.json()
      if (json.data) setAlertSettings(json.data)
    }
  }, [])

  const fetchClaudeConfig = useCallback(async () => {
    const res = await fetch('/api/config')
    if (res.ok) {
      const json = await res.json()
      const cfg = (json.config ?? {}) as Record<string, unknown>
      setClaudeConfig(cfg)
      setConfigJsonText(JSON.stringify(cfg, null, 2))
    }
  }, [])

  useEffect(() => { fetchKeys() }, [fetchKeys])
  useEffect(() => { fetchAlertSettings() }, [fetchAlertSettings])
  useEffect(() => { fetchClaudeConfig() }, [fetchClaudeConfig])

  const handleAdd = async () => {
    if (!apiKey) return
    setLoading(true)
    await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, label: label || undefined }),
    })
    setApiKey('')
    setLabel('')
    setLoading(false)
    fetchKeys()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/keys?id=${id}`, { method: 'DELETE' })
    fetchKeys()
  }

  const handleSaveAlertSettings = async () => {
    setAlertLoading(true)
    setAlertSaved(false)
    const res = await fetch('/api/alerts/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threshold: alertSettings.threshold,
        enabled: alertSettings.enabled,
      }),
    })
    setAlertLoading(false)
    if (res.ok) setAlertSaved(true)
  }

  const handleSaveConfig = async () => {
    setConfigLoading(true)
    setConfigSaved(false)
    setConfigError('')
    let payload: Record<string, unknown>
    if (configMode === 'json') {
      try {
        payload = JSON.parse(configJsonText)
      } catch (e) {
        setConfigError('JSON 格式错误: ' + (e as Error).message)
        setConfigLoading(false)
        return
      }
    } else {
      payload = claudeConfig ?? {}
    }
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setConfigLoading(false)
      if (res.ok) {
        setConfigSaved(true)
        if (configMode === 'json') {
          setClaudeConfig(payload)
        }
      } else {
        setConfigError('保存失败')
      }
    } catch {
      setConfigLoading(false)
      setConfigError('保存失败')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">账户设置</h1>

      <div className="max-w-lg space-y-6">
        {/* API Key 绑定 */}
        <Card className="bg-card shadow-sm rounded-2xl border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Key className="size-4 text-primary" />
              绑定 API Key
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Provider</Label>
              <div className="flex gap-2">
                {providers.map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={provider === p ? 'default' : 'outline'}
                    onClick={() => setProvider(p)}
                    className={provider !== p ? 'border-border text-foreground hover:bg-secondary' : ''}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-muted-foreground">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="label" className="text-muted-foreground">备注（可选）</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="我的 OpenAI Key"
                className={inputClass}
              />
            </div>

            <Button variant="default" onClick={handleAdd} disabled={!apiKey || loading}>
              {loading ? '保存中...' : '添加 Key'}
            </Button>
          </CardContent>
        </Card>

        {/* 用量预警 */}
        <Card className="bg-card shadow-sm rounded-2xl border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Bell className="size-4 text-primary" />
              用量预警
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <Label className="text-sm text-muted-foreground">邮件余额预警</Label>
              </div>
              <button
                type="button"
                onClick={() => setAlertSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative inline-flex h-[21px] w-[38px] shrink-0 cursor-pointer rounded-full transition-colors ${
                  alertSettings.enabled ? 'bg-primary' : 'bg-border'
                }`}
              >
                <span
                  className={`inline-block size-[15px] rounded-full bg-white shadow transition-transform ${
                    alertSettings.enabled ? 'translate-x-[17px]' : 'translate-x-[3px]'
                  }`}
                  style={{ marginTop: '3px' }}
                />
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold" className="text-muted-foreground">
                预警阈值（积分）
              </Label>
              <Input
                id="threshold"
                type="number"
                min={0}
                max={10000}
                value={alertSettings.threshold}
                onChange={(e) => setAlertSettings((prev) => ({ ...prev, threshold: Number(e.target.value) }))}
                className={inputClass}
              />
              <p className="text-xs text-muted-foreground">
                当余额低于此值时，将发送邮件提醒（24 小时内最多一次）
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="default"
                onClick={handleSaveAlertSettings}
                disabled={alertLoading}
              >
                {alertLoading ? '保存中...' : '保存设置'}
              </Button>
              {alertSaved && (
                <span className="text-sm text-[#7cb870]">保存成功</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 已绑定的 Key */}
        <Card className="bg-card shadow-sm rounded-2xl border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Shield className="size-4 text-primary" />
              已绑定的 Key
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {keys.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无绑定的 API Key</p>
            ) : (
              <div className="space-y-2">
                {keys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between rounded-lg bg-secondary p-3 border border-border">
                    <div>
                      <p className="text-sm font-medium capitalize text-foreground">{k.provider}</p>
                      <p className="text-xs text-muted-foreground">{k.keyHint}{k.label ? ` — ${k.label}` : ''}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(k.id)} className="border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Claude Code 配置 — 双模式编辑 */}
        <Card className="bg-card shadow-sm rounded-2xl border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <FileJson className="size-4 text-primary" />
              Claude Code 配置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 模式切换 */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={configMode === 'visual' ? 'default' : 'outline'}
                onClick={() => setConfigMode('visual')}
                className={configMode !== 'visual' ? 'border-border text-foreground hover:bg-secondary' : ''}
              >
                <Eye className="size-3.5 mr-1" />
                可视化
              </Button>
              <Button
                size="sm"
                variant={configMode === 'json' ? 'default' : 'outline'}
                onClick={() => setConfigMode('json')}
                className={configMode !== 'json' ? 'border-border text-foreground hover:bg-secondary' : ''}
              >
                <FileJson className="size-3.5 mr-1" />
                原始 JSON
              </Button>
            </div>

            {configMode === 'visual' ? (
              <div className="space-y-3">
                {Object.keys(claudeConfig ?? {}).length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无配置，请在模型管理页选择模型并应用</p>
                ) : (
                  Object.entries(claudeConfig ?? {}).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between rounded-lg bg-secondary p-3 border border-border">
                      <span className="text-sm font-medium text-foreground">{k}</span>
                      <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                        {typeof v === 'string' ? v : JSON.stringify(v)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={configJsonText}
                  onChange={(e) => setConfigJsonText(e.target.value)}
                  className="w-full h-48 rounded-lg border border-border bg-secondary p-3 text-sm font-mono text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                  spellCheck={false}
                />
                {configError && (
                  <p className="text-xs text-destructive">{configError}</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                variant="default"
                onClick={handleSaveConfig}
                disabled={configLoading}
              >
                {configLoading ? '保存中...' : '保存配置'}
              </Button>
              {configSaved && (
                <span className="text-sm text-[#7cb870]">保存成功</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
