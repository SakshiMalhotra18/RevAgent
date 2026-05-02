"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts"

interface CacChartProps {
  data: Record<string, number | string | null>[]
}

function formatDate(value: string) {
  const date = new Date(value)
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" })
}

export default function CacChart({ data }: CacChartProps) {
  const numeric = data
    .map((row) => Number(row.CAC))
    .filter((value) => !Number.isNaN(value))

  const mean =
    numeric.length > 0
      ? numeric.reduce((sum, value) => sum + value, 0) / numeric.length
      : 0

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 text-lg font-semibold text-zinc-50">CAC Trend</div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(39,39,42,0.5)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => formatDate(String(value))}
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={{ stroke: "#27272a" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={{ stroke: "#27272a" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: 12,
                color: "#fafafa",
              }}
            />
            <ReferenceLine
              y={mean}
              stroke="#71717a"
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="CAC"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}