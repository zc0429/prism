'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { TokenUsageChart, type DailyUsage } from '@/components/charts/TokenUsageChart'
import { ModelDistributionChart, type ModelDistribution } from '@/components/charts/ModelDistributionChart'

interface SummaryData {
  totalTokens: number
  totalCost: number
  activeModels: number
  modelDistribution: ModelDistribution[]
  dailyUsage: DailyUsage[]
}

interface LogRow {
  id: string
  createdAt: string
  toolId: string | null
  model: string
  inputTokens: number | null
  outputTokens: number | null
  costUsd: number | null
}

export default function UsagePage() {
  const [range, setRange] = useState('30d')
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [logs, setLogs] = useState<LogRow[]>([])
  const [totalLogs, setTotalLogs] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const fetchSummary = useCallback(async () => {
    const res = await fetch(`/api/usage/summary?range=${range}`)
    if (res.ok) {
      const json = await res.json()
      setSummary(json.data)
    }
  }, [range])

  const fetchLogs = useCallback(async () => {
    const res = await fetch(`/api/usage/logs?range=${range}&page=${page}&pageSize=${pageSize}`)
    if (res.ok) {
      const json = await res.json()
      setLogs(json.data)
      setTotalLogs(json.total)
    }
  }, [range, page])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    setPage(1)
  }, [range])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const formatNumber = (n: number) => n.toLocaleString('zh-CN')

  const exportCsv = () => {
    if (!logs.length) return
    const header = '日期,工具,模型,输入Tokens,输出Tokens,费用(USD)'
    const rows = logs.map((r) =>
      [
        new Date(r.createdAt).toLocaleDateString('zh-CN'),
        r.toolId ?? '',
        r.model,
        r.inputTokens ?? 0,
        r.outputTokens ?? 0,
        r.costUsd ?? 0,
      ].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usage-${range}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(totalLogs / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">用量详情</h1>
        <Tabs value={range} onValueChange={(v) => setRange(v)}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="7d" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">7 天</TabsTrigger>
            <TabsTrigger value="30d" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">30 天</TabsTrigger>
            <TabsTrigger value="90d" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">90 天</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card shadow-sm rounded-2xl border border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">总 Token 用量</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatNumber(summary?.totalTokens ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm rounded-2xl border border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">总费用</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">${(summary?.totalCost ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm rounded-2xl border border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">活跃模型</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{summary?.activeModels ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card shadow-sm rounded-2xl border border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Token 使用趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <TokenUsageChart data={summary?.dailyUsage ?? []} />
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm rounded-2xl border border-border">
          <CardHeader>
            <CardTitle className="text-foreground">模型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ModelDistributionChart data={summary?.modelDistribution ?? []} />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card shadow-sm rounded-2xl border border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">使用记录</CardTitle>
            <Button variant="outline" size="sm" onClick={exportCsv} className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary">
              <Download className="size-3.5" />
              导出 CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-secondary">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">日期</TableHead>
                <TableHead className="text-muted-foreground">工具</TableHead>
                <TableHead className="text-muted-foreground">模型</TableHead>
                <TableHead className="text-right text-muted-foreground">输入 Tokens</TableHead>
                <TableHead className="text-right text-muted-foreground">输出 Tokens</TableHead>
                <TableHead className="text-right text-muted-foreground">费用</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((row) => (
                  <TableRow key={row.id} className="border-border">
                    <TableCell className="text-foreground">{new Date(row.createdAt).toLocaleDateString('zh-CN')}</TableCell>
                    <TableCell><Badge variant="secondary" className="bg-secondary text-foreground border border-border">{row.toolId ?? '-'}</Badge></TableCell>
                    <TableCell className="text-foreground">{row.model}</TableCell>
                    <TableCell className="text-right text-foreground">{formatNumber(row.inputTokens ?? 0)}</TableCell>
                    <TableCell className="text-right text-foreground">{formatNumber(row.outputTokens ?? 0)}</TableCell>
                    <TableCell className="text-right text-foreground">${(row.costUsd ?? 0).toFixed(4)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="border-border text-foreground hover:bg-secondary"
              >
                上一页
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="border-border text-foreground hover:bg-secondary"
              >
                下一页
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
