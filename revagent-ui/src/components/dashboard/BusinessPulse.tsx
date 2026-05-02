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
  
  let status = "Healthy"
  let colorClass = "text-emerald-600"
  let bgClass = "bg-emerald-50"
  let borderClass = "border-emerald-100"

  if (score < 60) {
    status = "Critical"
    colorClass = "text-rose-600"
    bgClass = "bg-rose-50"
    borderClass = "border-rose-100"
  } else if (score < 85) {
    status = "Monitoring"
    colorClass = "text-amber-600"
    bgClass = "bg-amber-50"
    borderClass = "border-amber-100"
  }

  return (
    <div className={`mb-8 flex items-center justify-between rounded-3xl border ${borderClass} ${bgClass} p-8 shadow-sm transition-all hover:shadow-md`}>
      <div className="flex items-center gap-8">
        <div className="relative h-20 w-20">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="stroke-slate-200"
              strokeWidth="3.5"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={`transition-all duration-1000 ease-out ${status === 'Critical' ? 'stroke-rose-500' : status === 'Healthy' ? 'stroke-emerald-500' : 'stroke-amber-500'}`}
              strokeWidth="3.5"
              strokeDasharray={`${score}, 100`}
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-slate-900">
            {Math.round(score)}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">Portfolio Health</div>
          <div className={`text-3xl font-black tracking-tight ${colorClass}`}>{status}</div>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="flex gap-10">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Analysis Focus</div>
            <div className="text-sm font-bold text-slate-700">{report.report_type}</div>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Active Signals</div>
            <div className="text-sm font-bold text-slate-700">{total} Data Points</div>
          </div>
        </div>
      </div>
    </div>
  )
}
