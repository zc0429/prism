"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Check, Download, Apple, Monitor, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type OS = "macos" | "windows" | "linux"

const osMap: Record<OS, { name: string; arch: string; ext: string; size: string; req: string; icon: React.ReactNode }> = {
  macos: {
    name: "macOS",
    arch: "Apple Silicon & Intel · DMG",
    ext: ".dmg",
    size: "82.4 MB · macOS 12+",
    req: "macOS 12+",
    icon: <Apple className="size-7 text-foreground" />,
  },
  windows: {
    name: "Windows",
    arch: "x64 · NSIS 安装程序",
    ext: ".exe",
    size: "74.1 MB · Windows 10+",
    req: "Windows 10+",
    icon: <Monitor className="size-7 text-foreground" />,
  },
  linux: {
    name: "Linux",
    arch: "x64 · AppImage / .deb",
    ext: ".AppImage",
    size: "78.6 MB · Ubuntu 20.04+",
    req: "Ubuntu 20.04+",
    icon: <Server className="size-7 text-foreground" />,
  },
}

function detectOS(): OS {
  if (typeof navigator === "undefined") return "macos"
  const platform = navigator.platform?.toLowerCase() || ""
  const userAgent = navigator.userAgent?.toLowerCase() || ""
  if (platform.includes("win") || userAgent.includes("win")) return "windows"
  if (platform.includes("linux") || userAgent.includes("linux")) return "linux"
  return "macos"
}

export default function DownloadPage() {
  const [selectedOS, setSelectedOS] = useState<OS>("macos")
  const [detected, setDetected] = useState<OS | null>(null)

  useEffect(() => {
    const os = detectOS()
    setDetected(os)
    setSelectedOS(os)
  }, [])

  const current = osMap[selectedOS]

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
          Prism — Claude Code 增强工具
        </h1>
        <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground">
          适用于国内开发者的 Claude Code 图形化管理工具，无需命令行，开箱即用
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          <Check className="size-3.5 text-green-600" />
          最新版 v0.2.1 · 2025-05-06 发布
        </div>
      </div>

      {/* OS Tabs */}
      <div className="mb-6 flex justify-center">
        <Tabs value={selectedOS} onValueChange={(v) => setSelectedOS(v as OS)}>
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="macos" className="gap-1.5">
              <Apple className="size-4" />
              macOS
            </TabsTrigger>
            <TabsTrigger value="windows" className="gap-1.5">
              <Monitor className="size-4" />
              Windows
            </TabsTrigger>
            <TabsTrigger value="linux" className="gap-1.5">
              <Server className="size-4" />
              Linux
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Download Card */}
      <Card className="mb-6 border-2 border-border transition-colors hover:border-primary/50">
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <div className="relative">
            {detected === selectedOS && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                推荐
              </Badge>
            )}
            <div className="flex size-16 items-center justify-center rounded-xl border border-border bg-muted">
              {current.icon}
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">{current.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{current.arch}</p>
          </div>
          <Button size="lg" className="h-11 min-w-[200px] gap-2 text-base">
            <Download className="size-4" />
            下载 for {current.name}
          </Button>
          <p className="text-xs text-muted-foreground">{current.size}</p>
        </CardContent>
      </Card>

      {/* Info row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground">最新版本</p>
            <p className="mt-1 text-sm font-medium text-foreground">v0.2.1</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground">Claude Code 内核</p>
            <p className="mt-1 text-sm font-medium text-foreground">v1.1.7</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground">更新日期</p>
            <p className="mt-1 text-sm font-medium text-foreground">2025-05-06</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground">开源协议</p>
            <p className="mt-1 text-sm font-medium text-foreground">MIT</p>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mb-6">
        <CardContent className="py-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">安装说明</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">下载安装包</p>
                <p className="mt-0.5 text-xs text-muted-foreground">选择对应系统版本并下载</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">运行安装程序</p>
                <p className="mt-0.5 text-xs text-muted-foreground">按向导提示完成安装</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">开始使用</p>
                <p className="mt-0.5 text-xs text-muted-foreground">启动 Prism 并登录账号</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login link */}
      <div className="text-center">
        <Link
          href="/sign-in"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          已有账号？直接登录
        </Link>
      </div>
    </div>
  )
}
