"use client"

import type { Driver } from "@/lib/types"

interface DriversSectionProps {
  drivers: Driver[]
}

function borderClass(confidence: Driver["confidence"]) {
  if (confidence === "high") return "border-l-rose-500"
  if (confidence === "medium") return "border-l-amber-500"
  return "border-l-slate-400"
}

function badgeClass(confidence: Driver["confidence"]) {
  if (confidence === "high") {
    return "bg-rose-50 text-rose-600 border-rose-100"
  }
  if (confidence === "medium") {
    return "bg-amber-50 text-amber-600 border-amber-100"
  }
  return "bg-slate-50 text-slate-500 border-slate-200"
}

export default function DriversSection({ drivers }: DriversSectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1.5 rounded-full bg-violet-600"></div>
        <h3 className="text-2xl font-black tracking-tight text-slate-900">Root Cause Analysis</h3>
      </div>

      <div className="grid gap-6">
        {drivers.map((driver, idx) => (
          <div
            key={idx}
            className={`rounded-[2rem] border border-slate-200 border-l-[6px] bg-white p-8 shadow-sm transition-all hover:shadow-md ${borderClass(
              driver.confidence
            )}`}
          >
            <div className="mb-4 flex items-start justify-between gap-6">
              <div className="text-lg font-bold leading-tight text-slate-800">
                {driver.hypothesis}
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${badgeClass(driver.confidence)}`}>
                {driver.confidence} confidence
              </span>
            </div>

            <div className="mb-6 text-sm leading-relaxed font-medium text-slate-500">
              {driver.evidence}
            </div>

            <div className="flex flex-wrap gap-2">
              {driver.supporting_metrics.map((metric) => (
                <span
                  key={metric}
                  className="rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wide"
                >
                  {metric.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}