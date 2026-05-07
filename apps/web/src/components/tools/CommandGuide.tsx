'use client'

import { useMemo, useState } from 'react'
import { Monitor, Apple, Terminal, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { CommandStep, ToolGuide } from '@/lib/tools/types'

type OS = 'windows' | 'macos' | 'linux'

const osConfig: Record<OS, { label: string; icon: React.ElementType }> = {
  windows: { label: 'Windows', icon: Monitor },
  macos: { label: 'macOS', icon: Apple },
  linux: { label: 'Linux', icon: Terminal },
}

function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'linux'
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('win')) return 'windows'
  if (ua.includes('mac')) return 'macos'
  return 'linux'
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      size="icon-xs"
      variant="outline"
      className="shrink-0"
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
    >
      {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
    </Button>
  )
}

function CommandSteps({ steps, os }: { steps: CommandStep[]; os: OS }) {
  return (
    <ol className="list-decimal list-inside space-y-3">
      {steps.map((step, i) => {
        const displayCommand = step.osCommands ? step.osCommands[os] : step.command
        return (
          <li key={i}>
            <div className="font-medium mb-1.5 text-sm text-foreground">{step.label}</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-secondary px-3 py-2 text-xs font-mono break-all text-foreground">
                {displayCommand}
              </code>
              <CopyButton text={displayCommand} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function CommandGuide({
  open,
  onOpenChange,
  guide,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  guide: ToolGuide | null
}) {
  const [mode, setMode] = useState<'byok' | 'platform'>('byok')
  const [apiKey, setApiKey] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [os, setOs] = useState<OS>(detectOS)

  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:4000'

  const steps = useMemo(() => {
    if (!token || !guide) return []
    if (mode === 'byok') {
      return guide.byok.steps(apiKey)
    }
    return guide.platform.steps(gatewayUrl, token)
  }, [token, mode, guide, apiKey, gatewayUrl])

  if (!guide) return null

  const handleClose = () => {
    setMode('byok')
    setApiKey('')
    setToken(null)
    setError(null)
    onOpenChange(false)
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      if (mode === 'byok') {
        setToken(apiKey)
      } else {
        const res = await fetch('/api/tools/virtual-key', { method: 'POST' })
        const json = await res.json()
        if (json.key) {
          setToken(json.key)
        } else {
          setError(json.error ?? 'Failed to generate token')
        }
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const hasOsCommands = steps.some((s) => s.osCommands)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto bg-card border border-border">
        <DialogHeader>
          <DialogTitle>{guide.name} Setup Guide</DialogTitle>
          <DialogDescription>
            Choose your connection mode and follow the terminal commands
          </DialogDescription>
        </DialogHeader>

        {token ? (
          <div className="space-y-4">
            {hasOsCommands && (
              <div className="flex gap-1 border-b pb-3">
                {(Object.keys(osConfig) as OS[]).map((o) => {
                  const OsIcon = osConfig[o].icon
                  return (
                    <Button
                      key={o}
                      size="sm"
                      variant={os === o ? 'secondary' : 'ghost'}
                      onClick={() => setOs(o)}
                    >
                      <OsIcon className="size-3.5" />
                      {osConfig[o].label}
                    </Button>
                  )
                })}
              </div>
            )}
            <CommandSteps steps={steps} os={os} />
            <Button variant="outline" onClick={handleClose} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Connection Mode</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant={mode === 'byok' ? 'secondary' : 'outline'}
                  onClick={() => setMode('byok')}
                >
                  {guide.byok.label}
                </Button>
                <Button
                  variant={mode === 'platform' ? 'secondary' : 'outline'}
                  onClick={() => setMode('platform')}
                >
                  {guide.platform.label}
                </Button>
              </div>
            </div>

            {mode === 'byok' && (
              <div>
                <Label htmlFor="apikey">API Key</Label>
                <Input
                  id="apikey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API Key"
                  className="mt-1"
                />
              </div>
            )}

            {mode === 'platform' && (
              <p className="text-sm text-muted-foreground">
                Use Prism platform credits. A token will be generated for you &mdash; no API key needed.
              </p>
            )}

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={mode === 'byok' ? !apiKey || loading : loading}
            >
              {loading ? 'Generating...' : mode === 'platform' ? 'Generate Token' : 'Show Commands'}
            </Button>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
