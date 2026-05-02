"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

interface RefundChartProps {
  data: Record<string, number | string | null>[]
}

function formatDate(value: string) {
  const date = new Date(value)
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" })
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

export default function RefundChart({ data }: RefundChartProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 text-lg font-semibold text-zinc-50">
        Refund Rate Trend
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid stroke="rgba(39,39,42,0.5)" vertical={false} />

            <XAxis
              dataKey="date"
              tickFormatter={(value) => formatDate(String(value))}
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={{ stroke: "#27272a" }}
              tickLine={false}
            />

            <YAxis
              tickFormatter={(value) => formatPercent(Number(value))}
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={{ stroke: "#27272a" }}
              tickLine={false}
              width={55}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: 12,
                color: "#fafafa",
              }}
              labelFormatter={(value) => formatDate(String(value))}
              formatter={(value) => [
                formatPercent(Number(value)),
                "Refund Rate",
              ]}
            />

            <Area
              type="monotone"
              dataKey="refund_rate"
              stroke="#ef4444"
              fill="rgba(239,68,68,0.15)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}