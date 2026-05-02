"use client"

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

interface AdSpendChartProps {
  data: Record<string, number | string | null>[]
}

function formatDate(value: string) {
  const date = new Date(value)
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" })
}

export default function AdSpendChart({ data }: AdSpendChartProps) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-900">
            Ad Spend Correlation
          </h3>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Spend vs. Revenue Ingest</p>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              yAxisId="left"
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              dx={-5}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              dx={5}
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
              itemStyle={{ fontWeight: 700 }}
              cursor={{ fill: '#f8fafc' }}
            />
            <Bar
              yAxisId="left"
              dataKey="total_spend"
              fill="#cbd5e1"
              radius={[6, 6, 0, 0]}
              barSize={30}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="net_revenue"
              stroke="#7c3aed"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#7c3aed' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}