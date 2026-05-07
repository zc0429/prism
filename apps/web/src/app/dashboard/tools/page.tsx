'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Terminal, Braces, Code, Cpu, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CommandGuide } from '@/components/tools/CommandGuide'
import { claudeCodeGuide } from '@/lib/tools/claude-code'
import { opencodeGuide } from '@/lib/tools/opencode'
import { openclawGuide } from '@/lib/tools/openclaw'
import { hermesGuide } from '@/lib/tools/hermes'
import type { ToolGuide } from '@/lib/tools/types'

const guides: ToolGuide[] = [claudeCodeGuide, opencodeGuide, openclawGuide, hermesGuide]

const toolIcons: Record<string, React.ElementType> = {
  'claude-code': Terminal,
  'opencode': Braces,
  'openclaw': Code,
  'hermes': Cpu,
}

export default function ToolsPage() {
  const [activeGuide, setActiveGuide] = useState<ToolGuide | null>(null)

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-6">工具管理</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {guides.map((guide) => {
          const Icon = toolIcons[guide.id]
          const isClaudeCode = guide.id === 'claude-code'
          return (
            <div
              key={guide.id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  {Icon && <Icon className="size-5 text-primary" />}
                </div>
                <h2 className="font-semibold text-foreground">{guide.name}</h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {guide.providers.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/20"
                  >
                    {p}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mt-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="self-start"
                  onClick={() => setActiveGuide(guide)}
                >
                  查看指南
                </Button>
                {isClaudeCode && (
                  <Link href="/setup">
                    <Button
                      size="sm"
                      variant="default"
                      className="self-start gap-1.5"
                    >
                      <Settings className="size-3.5" />
                      配置
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <CommandGuide
        open={activeGuide !== null}
        onOpenChange={(open) => { if (!open) setActiveGuide(null) }}
        guide={activeGuide}
      />
    </div>
  )
}
