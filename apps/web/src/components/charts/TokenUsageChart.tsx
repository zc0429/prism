'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export interface DailyUsage {
  date: string
  inputTokens: number
  outputTokens: number
}

export function TokenUsageChart({ data }: { data: DailyUsage[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        暂无数据
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" fontSize={12} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
        <YAxis fontSize={12} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
        <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
        <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} />
        <Line
          type="monotone"
          dataKey="inputTokens"
          name="输入 Tokens"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: 'var(--chart-1)' }}
        />
        <Line
          type="monotone"
          dataKey="outputTokens"
          name="输出 Tokens"
          stroke="var(--chart-2)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: 'var(--chart-2)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
