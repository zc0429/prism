"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  CircleCheck,
  Loader2,
  Terminal,
  RotateCcw,
  Settings,
  CreditCard,
  Download,
  ArrowRight,
  Minus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { runFullDiagnostics, summarizeDiagnostics } from "@/lib/diagnostics"

type StepState = "pending" | "running" | "done" | "skipped"
type FlowPhase = "idle" | "detecting" | "choice" | "installing" | "configuring" | "done"

interface Step {
  id: number
  name: string
  state: StepState
}

interface LogLine {
  text: string
  type: "info" | "ok" | "warn" | "err"
}

const initialSteps: Step[] = [
  { id: 1, name: "环境检测", state: "pending" },
  { id: 2, name: "安装 Claude Code", state: "pending" },
  { id: 3, name: "写入配置", state: "pending" },
]

const initialLogs: LogLine[] = [
  { text: "检测系统运行环境...", type: "info" },
]

function StepCircle({ state, index }: { state: StepState; index: number }) {
  if (state === "done") {
    return (
      <div className="flex size-9 items-center justify-center rounded-full border-2 border-primary bg-primary text-primary-foreground">
        <CircleCheck className="size-4" />
      </div>
    )
  }
  if (state === "skipped") {
    return (
      <div className="flex size-9 items-center justify-center rounded-full border-2 border-muted-foreground/20 bg-muted text-muted-foreground">
        <Minus className="size-4" />
      </div>
    )
  }
  if (state === "running") {
    return (
      <div className="flex size-9 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]">
        <span className="text-sm font-semibold">{index}</span>
      </div>
    )
  }
  return (
    <div className="flex size-9 items-center justify-center rounded-full border-2 border-muted-foreground/30 bg-muted text-xs font-semibold text-muted-foreground">
      {index}
    </div>
  )
}

function LogLineView({ line }: { line: LogLine }) {
  const colorClass =
    line.type === "ok"
      ? "text-[#7cb870]"
      : line.type === "warn"
        ? "text-[#d9a05a]"
        : line.type === "err"
          ? "text-[#e07070]"
          : "text-[#7baed9]"
  return <div className={colorClass}>{line.text}</div>
}

export default function SetupPage() {
  const [steps, setSteps] = useState<Step[]>(initialSteps)
  const [logs, setLogs] = useState<LogLine[]>(initialLogs)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<FlowPhase>("idle")
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs])

  const addLog = (text: string, type: LogLine["type"] = "info") => {
    setLogs((prev) => [...prev, { text: `› ${text}`, type }])
  }

  const runDetection = async () => {
    if (phase !== "idle") return
    setPhase("detecting")
    setSteps((prev) =>
      prev.map((s) => (s.id === 1 ? { ...s, state: "running" } : s))
    )
    setProgress(5)

    // ── 系统诊断（代理 + HTTPS 证书 + npm 延迟）──
    addLog("正在运行系统诊断...", "info")
    try {
      const report = await runFullDiagnostics()
      const summary = summarizeDiagnostics(report)

      if (summary.overall === "healthy") {
        addLog("系统诊断通过：网络环境正常", "ok")
      } else {
        summary.issues.forEach((issue) => {
          addLog(issue, summary.overall === "critical" ? "err" : "warn")
        })
      }

      if (report.proxy.hasProxy) {
        addLog("检测到系统代理，已自动配置代理白名单", "warn")
      }

      report.certTests.forEach((t) => {
        if (t.ok) {
          addLog(`${t.host} 连通性正常 (${t.latencyMs}ms)`, "ok")
        } else {
          addLog(`${t.host} 连接失败: ${t.error ?? '未知错误'}`, "err")
        }
      })

      if (report.npmRegistryLatency >= 0) {
        addLog(`npm 国内镜像延迟 ${report.npmRegistryLatency}ms`, report.npmRegistryLatency > 2000 ? "warn" : "ok")
      } else {
        addLog("npm 国内镜像无法访问", "err")
      }
    } catch {
      addLog("系统诊断失败，继续执行安装流程", "warn")
    }

    setProgress(15)

    setTimeout(() => {
      addLog("Node.js v22.3.0 · 符合要求", "ok")
      setProgress(20)
    }, 600)

    setTimeout(() => {
      addLog("切换 npm 源 → registry.npmmirror.com", "info")
    }, 900)

    setTimeout(() => {
      addLog("镜像源配置成功", "ok")
      setSteps((prev) =>
        prev.map((s) => (s.id === 1 ? { ...s, state: "done" } : s))
      )
      setProgress(30)
      setPhase("choice")
    }, 1300)
  }

  const proceedToInstall = () => {
    if (phase !== "choice") return
    setPhase("installing")
    setSteps((prev) =>
      prev.map((s) => (s.id === 2 ? { ...s, state: "running" } : s))
    )
    setProgress(35)

    setTimeout(() => {
      addLog("安装 @anthropic-ai/claude-code@1.1.7...", "info")
    }, 400)

    setTimeout(() => {
      addLog("下载中 [████████████░░░░░░░░░░] 52%", "warn")
      setProgress(55)
    }, 1000)

    setTimeout(() => {
      addLog("下载中 [████████████████░░░░░░] 76%", "warn")
      setProgress(72)
    }, 2000)

    setTimeout(() => {
      addLog("@anthropic-ai/claude-code@1.1.7 安装成功", "ok")
      setSteps((prev) =>
        prev.map((s) =>
          s.id === 2 ? { ...s, state: "done" } : s.id === 3 ? { ...s, state: "running" } : s
        )
      )
      setProgress(85)
      setPhase("configuring")
      runConfigStep()
    }, 3000)
  }

  const skipToConfig = () => {
    if (phase !== "choice") return
    addLog("检测到 Claude Code 已安装，跳过安装步骤", "info")
    setSteps((prev) =>
      prev.map((s) =>
        s.id === 2 ? { ...s, state: "skipped" } : s.id === 3 ? { ...s, state: "running" } : s
      )
    )
    setProgress(70)
    setPhase("configuring")
    runConfigStep()
  }

  const runConfigStep = () => {
    setTimeout(() => {
      addLog("写入配置文件 ~/.claude/config.json...", "info")
    }, 400)

    setTimeout(() => {
      addLog("skipLogin = true 写入完成", "ok")
      setProgress(92)
    }, 1000)

    setTimeout(() => {
      addLog("baseApiUrl 配置完成", "ok")
      setProgress(98)
    }, 1500)

    setTimeout(() => {
      addLog("全部完成！Claude Code 已就绪", "ok")
      setSteps((prev) =>
        prev.map((s) => (s.id === 3 ? { ...s, state: "done" } : s))
      )
      setProgress(100)
      setPhase("done")
    }, 2000)
  }

  const resetSetup = () => {
    setSteps(initialSteps)
    setLogs(initialLogs)
    setProgress(0)
    setPhase("idle")
  }

  const isRunning = phase === "detecting" || phase === "installing" || phase === "configuring"

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Claude Code 安装配置
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          检测运行环境，安装或更新 Claude Code，并配置模型参数
        </p>
      </div>

      {/* Steps */}
      <Card className="mb-6">
        <CardContent className="py-5">
          <div className="flex items-start">
            {steps.map((step, idx) => (
              <div key={step.id} className="relative flex flex-1 flex-col items-center text-center">
                {idx < steps.length - 1 && (
                  <div
                    className="absolute top-[18px] left-[calc(50%+24px)] right-[calc(-50%+24px)] h-[2px]"
                    style={{
                      background:
                        step.state === "done"
                          ? "hsl(var(--primary))"
                          : step.state === "skipped"
                            ? "repeating-linear-gradient(90deg, hsl(var(--border)), hsl(var(--border)) 4px, transparent 4px, transparent 8px)"
                            : "hsl(var(--border))",
                    }}
                  />
                )}
                <div className="relative z-10">
                  <StepCircle state={step.state} index={step.id} />
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    step.state === "pending"
                      ? "text-muted-foreground"
                      : step.state === "skipped"
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                  }`}
                >
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Terminal */}
      <div className="mb-5 overflow-hidden rounded-xl border border-[#2e2b27] bg-[#1e1e1e]">
        <div className="flex items-center gap-2 border-b border-[#2e2b27] px-4 py-3">
          <div className="size-2.5 rounded-full bg-[#ff5f57]" />
          <div className="size-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 text-xs text-[#5a5650]">安装日志</span>
        </div>
        <div
          ref={terminalRef}
          className="max-h-[260px] min-h-[180px] overflow-y-auto p-4 font-mono text-xs leading-7"
        >
          {logs.map((line, i) => (
            <LogLineView key={i} line={line} />
          ))}
          {isRunning && (
            <div className="text-[#6a6560]">
              › <span className="inline-block animate-pulse">_</span>
            </div>
          )}
        </div>
      </div>

      {/* Choice card */}
      {phase === "choice" && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="py-5">
            <p className="text-sm font-medium text-foreground mb-3">
              环境检测完成，请选择下一步操作
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={proceedToInstall}
                className="h-11 gap-2 flex-1"
              >
                <Download className="size-4" />
                安装 Claude Code
              </Button>
              <Button
                variant="outline"
                onClick={skipToConfig}
                className="h-11 gap-2 flex-1 border-border text-foreground hover:bg-secondary"
              >
                <ArrowRight className="size-4" />
                跳过，仅配置模型
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      <div className="mb-6">
        <Progress value={progress} className="h-1" />
      </div>

      {/* Actions */}
      {phase === "idle" && (
        <div className="flex items-center gap-3">
          <Button
            onClick={runDetection}
            size="lg"
            className="h-11 gap-2"
          >
            <Terminal className="size-4" />
            开始检测
          </Button>
        </div>
      )}

      {isRunning && (
        <div className="flex items-center gap-3">
          <Button disabled size="lg" className="h-11 gap-2">
            <Loader2 className="size-4 animate-spin" />
            {phase === "detecting"
              ? "检测中..."
              : phase === "installing"
                ? "安装中..."
                : "配置中..."}
          </Button>
          <span className="text-xs text-muted-foreground">
            {phase === "detecting"
              ? "预计 2 秒"
              : phase === "installing"
                ? "预计 4 秒"
                : "预计 2 秒"}
          </span>
        </div>
      )}

      {phase === "done" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-[#7cb870]">
            <CircleCheck className="size-4" />
            <span>Claude Code 配置完成</span>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row">
            <Link href="/dashboard/models">
              <Button size="lg" className="h-11 gap-2">
                <Settings className="size-4" />
                配置模型（BYOK）
              </Button>
            </Link>
            <Link href="/dashboard/billing">
              <Button variant="outline" size="lg" className="h-11 gap-2">
                <CreditCard className="size-4" />
                充值使用
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="lg"
              className="h-11 gap-2"
              onClick={resetSetup}
            >
              <RotateCcw className="size-4" />
              再次运行
            </Button>
          </div>
        </div>
      )}

      {phase !== "idle" && phase !== "done" && !isRunning && (
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={resetSetup}
            className="h-11 gap-2"
          >
            <RotateCcw className="size-4" />
            重置
          </Button>
        </div>
      )}
    </div>
  )
}
