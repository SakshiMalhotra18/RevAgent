"use client"

import type { AnalysisResult } from "@/lib/types"

interface BusinessPulseProps {
  report: AnalysisResult["report"]
}

export default function BusinessPulse({ report }: BusinessPulseProps) {
  // Simple heuristic for "health score" based on changes
  const negatives = report.changes.filter(c => c.direction.toLowerCase() === (c.metric === "net_revenue" ? "down" : "up")).length
  const total = report.changes.length
  const score = total > 0 ? Math.max(0, 100 - (negatives / total) * 60) : 100
  
  let status = "Stable"
  let colorClass = "text-green-400"
  let bgClass = "bg-green-500/10"
  let borderClass = "border-green-500/20"

  if (score < 60) {
    status = "Critical"
    colorClass = "text-red-400"
    bgClass = "bg-red-500/10"
    borderClass = "border-red-500/20"
  } else if (score < 85) {
    status = "Attention Required"
    colorClass = "text-amber-400"
    bgClass = "bg-amber-500/10"
    borderClass = "border-amber-500/20"
  }

  return (
    <div className={`mb-8 flex items-center justify-between rounded-2xl border ${borderClass} ${bgClass} p-6 transition-all hover:scale-[1.01]`}>
      <div className="flex items-center gap-6">
        <div className="relative h-16 w-16">
          <svg className="h-full w-full" viewBox="0 0 36 36">
            <path
              className="stroke-zinc-800"
              strokeWidth="3"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={`transition-all duration-1000 ease-out ${status === 'Critical' ? 'stroke-red-500' : status === 'Stable' ? 'stroke-green-500' : 'stroke-amber-500'}`}
              strokeWidth="3"
              strokeDasharray={`${score}, 100`}
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-zinc-50">
            {Math.round(score)}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Business Health Score</div>
          <div className={`text-2xl font-bold ${colorClass}`}>{status}</div>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="flex gap-4">
          <div className="text-right">
            <div className="text-xs font-medium text-zinc-500">Analysis Type</div>
            <div className="text-sm font-semibold text-zinc-300">{report.report_type}</div>
          </div>
          <div className="h-10 w-px bg-zinc-800" />
          <div className="text-right">
            <div className="text-xs font-medium text-zinc-500">Metric Signals</div>
            <div className="text-sm font-semibold text-zinc-300">{total} active alerts</div>
          </div>
        </div>
      </div>
    </div>
  )
}
