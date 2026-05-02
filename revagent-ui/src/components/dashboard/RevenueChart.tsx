"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts"

interface RevenueChartProps {
  data: Record<string, number | string | null>[]
  anomalyDates: string[]
}

function formatDate(value: string) {
  const date = new Date(value)
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" })
}

function formatMoneyTick(value: number) {
  if (value === 0) return "$0"
  return `$${Math.round(value / 1000)}k`
}

export default function RevenueChart({
  data,
  anomalyDates,
}: RevenueChartProps) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-900">
            Net Revenue Performance
          </h3>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Historical Trend · USD</p>
        </div>
        <div className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-500 border border-slate-100">
          Last 30 Days
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
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
              tickFormatter={formatMoneyTick}
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
              formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
              labelFormatter={(value) => formatDate(String(value))}
            />

            {[...new Set(anomalyDates)].map((date) => (
              <ReferenceLine
                key={`anomaly-line-${date}`}
                x={date}
                stroke="#f43f5e"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            ))}

            <Area
              type="monotone"
              dataKey="net_revenue"
              stroke="#7c3aed"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRev)"
              dot={(props) => {
                const payloadDate = String(props.payload?.date)
                const isAnomaly = anomalyDates.includes(payloadDate)
                if (!isAnomaly) return <></>
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={6}
                    fill="#f43f5e"
                    stroke="#ffffff"
                    strokeWidth={3}
                  />
                )
              }}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#7c3aed' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}