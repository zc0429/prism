'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from 'recharts'

export interface ModelDistribution {
  model: string
  count: number
}

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function ModelDistributionChart({ data }: { data: ModelDistribution[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        暂无数据
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="model"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={(props: PieLabelRenderProps) =>
            `${props.name ?? ''} ${((Number(props.percent) || 0) * 100).toFixed(0)}%`
          }
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
        <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
