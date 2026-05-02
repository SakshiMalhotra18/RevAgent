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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm transition-all hover:border-zinc-700">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-lg font-semibold tracking-tight text-zinc-50">
          Net Revenue Trend
        </div>
        <div className="text-xs font-medium text-zinc-500">Last 30 Days</div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => formatDate(String(value))}
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tickFormatter={formatMoneyTick}
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#09090b",
                border: "1px solid #27272a",
                borderRadius: "12px",
                fontSize: "12px",
                padding: "12px",
              }}
              itemStyle={{ color: "#fafafa" }}
              cursor={{ stroke: "#3f3f46", strokeWidth: 1 }}
              formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
              labelFormatter={(value) => formatDate(String(value))}
            />

            {[...new Set(anomalyDates)].map((date) => (
              <ReferenceLine
                key={`anomaly-line-${date}`}
                x={date}
                stroke="#ef4444"
                strokeWidth={1}
                strokeDasharray="4 4"
                label={{ position: 'top', value: '!', fill: '#ef4444', fontSize: 14, fontWeight: 'bold' }}
              />
            ))}

            <Area
              type="monotone"
              dataKey="net_revenue"
              stroke="#7c3aed"
              strokeWidth={2.5}
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
                    r={5}
                    fill="#ef4444"
                    stroke="#09090b"
                    strokeWidth={2}
                  />
                )
              }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}