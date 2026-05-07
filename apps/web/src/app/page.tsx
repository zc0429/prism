'use client'

import { useEffect, useState } from 'react'
import { Download, Key, Zap } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: Download,
    title: '一键安装',
    description:
      '自动检测环境，使用国内 npm 镜像静默安装 Claude Code，无需命令行',
  },
  {
    icon: Key,
    title: '自带密钥',
    description:
      '可视化配置管理，内置国产大模型模板，填入 API Key 即可直连',
  },
  {
    icon: Zap,
    title: '按需付费',
    description:
      '支持微信 / 支付宝充值，按 Token 消耗扣费，国产与国际模型全覆盖',
  },
]

const terminalLines = [
  '$ npx prism install',
  '  Node.js v22.3.0 detected',
  '  Claude Code installed via npmmirror',
  '  Configuration written',
  '$ prism models list',
  '  deepseek  qwen  glm  moonshot',
  '$ prism start',
]

function getCurrentLineIndex(typedCount: number) {
  let remaining = typedCount
  for (const [i, line] of terminalLines.entries()) {
    if (remaining < line.length) {
      return i
    }
    remaining -= line.length
  }
  return terminalLines.length - 1
}

function computeDisplayedLines(typedCount: number): string[] {
  const lines: string[] = []
  let remaining = typedCount
  for (const line of terminalLines) {
    if (remaining <= 0) {
      lines.push('')
    } else if (remaining >= line.length) {
      lines.push(line)
      remaining -= line.length
    } else {
      lines.push(line.slice(0, remaining))
      remaining = 0
    }
  }
  while (lines.length < terminalLines.length) {
    lines.push('')
  }
  return lines
}

export default function Home() {
  const [typedCount, setTypedCount] = useState(0)

  useEffect(() => {
    const totalChars = terminalLines.reduce(
      (sum, line) => sum + line.length,
      0
    )
    const interval = setInterval(() => {
      setTypedCount((prev) => {
        if (prev >= totalChars) {
          return prev
        }
        return prev + 1
      })
    }, 30)
    return () => clearInterval(interval)
  }, [])

  const displayedLines = computeDisplayedLines(typedCount)
  const currentLineIndex = getCurrentLineIndex(typedCount)

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-secondary">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
            .cursor-blink {
              animation: blink 1s step-end infinite;
            }
          `,
        }}
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[60%] w-[50%] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] h-[60%] w-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] h-[50%] w-[50%] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <main className="relative z-10 flex flex-1 flex-col items-center px-6">
        <section className="flex w-full max-w-5xl flex-col items-center py-24 lg:py-32">
          <h1 className="text-6xl font-bold tracking-tight text-foreground sm:text-7xl lg:text-8xl">
            Prism
          </h1>
          <p className="mt-6 max-w-2xl text-center text-lg text-muted-foreground">
            面向国内开发者的 Claude Code 桌面端增强工具
          </p>
          <p className="mt-4 max-w-xl text-center text-base leading-relaxed text-muted-foreground">
            解决 Claude Code 安装难、配置繁琐、无法直连国产模型的痛点。
            一键安装，开箱即用，无需 VPN。
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Link href="/download">
              <Button size="lg">立即下载</Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" size="lg">
                登录
              </Button>
            </Link>
          </div>
        </section>

        <section className="w-full max-w-2xl pb-24">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="size-2.5 rounded-full bg-border" />
                <div className="size-2.5 rounded-full bg-border" />
                <div className="size-2.5 rounded-full bg-border" />
              </div>
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                prism — zsh
              </span>
            </div>
            <div className="font-mono text-sm leading-7 text-foreground">
              {terminalLines.map((line, i) => (
                <div
                  key={i}
                  className={line.startsWith('  ') ? 'text-muted-foreground' : ''}
                >
                  {displayedLines[i] || ''}
                  {i === currentLineIndex && (
                    <span className="cursor-blink ml-0.5 inline-block h-4 w-2 bg-foreground align-middle" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full max-w-5xl pb-24 lg:pb-32">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-5 flex size-11 items-center justify-center rounded-full bg-primary/10">
                  <feature.icon className="size-5 text-primary" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-sm text-muted-foreground">
          <span>Prism</span>
        </div>
      </footer>
    </div>
  )
}
