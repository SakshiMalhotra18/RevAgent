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
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-900">
            Customer Acquisition Cost
          </h3>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Unit Economics · USD</p>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="6 6" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => formatDate(String(value))}
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              dy={15}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              dx={-5}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                fontSize: "12px",
                padding: "16px",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              }}
              itemStyle={{ color: "#1e293b", fontWeight: 700 }}
              cursor={{ stroke: "#e2e8f0", strokeWidth: 2 }}
              formatter={(value) => [`$${Number(value).toFixed(2)}`, "CAC"]}
            />
            <ReferenceLine
              y={mean}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              label={{ position: 'right', value: 'Avg', fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            />
            <Line
              type="monotone"
              dataKey="CAC"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}