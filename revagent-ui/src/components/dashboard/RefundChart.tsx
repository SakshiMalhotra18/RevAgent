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
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-900">
            Refund Rate Analysis
          </h3>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Risk Monitoring · Percentage</p>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRefund" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(value) => formatPercent(Number(value))}
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              dx={-5}
              width={55}
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
              labelFormatter={(value) => formatDate(String(value))}
              formatter={(value) => [
                formatPercent(Number(value)),
                "Refund Rate",
              ]}
            />

            <Area
              type="monotone"
              dataKey="refund_rate"
              stroke="#f43f5e"
              fillOpacity={1}
              fill="url(#colorRefund)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}