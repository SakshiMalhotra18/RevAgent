"use client"

import type { Anomaly } from "@/lib/types"

interface AnomalyAlertsProps {
  anomalies: Anomaly[]
}

function badgeClass(severity: "high" | "medium" | "low") {
  if (severity === "high") {
    return "bg-rose-100 text-rose-700 border-rose-200"
  }
  if (severity === "medium") {
    return "bg-amber-100 text-amber-700 border-amber-200"
  }
  return "bg-slate-100 text-slate-600 border-slate-200"
}

function groupAnomalies(anomalies: Anomaly[]) {
  const groups = new Map<
    string,
    {
      metric: string
      severity: "high" | "medium" | "low"
      direction: "up" | "down"
      minChange: number
      maxChange: number
      count: number
      startDate: string
      endDate: string
    }
  >()

  for (const anomaly of anomalies) {
    const existing = groups.get(anomaly.metric)

    if (!existing) {
      groups.set(anomaly.metric, {
        metric: anomaly.metric,
        severity: anomaly.severity,
        direction: anomaly.direction,
        minChange: Math.abs(anomaly.change_pct),
        maxChange: Math.abs(anomaly.change_pct),
        count: 1,
        startDate: anomaly.date,
        endDate: anomaly.date,
      })
      continue
    }

    existing.count += 1
    existing.minChange = Math.min(existing.minChange, Math.abs(anomaly.change_pct))
    existing.maxChange = Math.max(existing.maxChange, Math.abs(anomaly.change_pct))

    if (anomaly.date < existing.startDate) existing.startDate = anomaly.date
    if (anomaly.date > existing.endDate) existing.endDate = anomaly.date

    const severityRank = { low: 1, medium: 2, high: 3 }
    if (severityRank[anomaly.severity] > severityRank[existing.severity]) {
      existing.severity = anomaly.severity
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    const severityRank = { low: 1, medium: 2, high: 3 }
    return severityRank[b.severity] - severityRank[a.severity]
  })
}

export default function AnomalyAlerts({ anomalies }: AnomalyAlertsProps) {
  if (!anomalies.length) {
    return (
      <section className="mb-8 overflow-hidden rounded-[2rem] border border-emerald-100 bg-emerald-50/50 p-8 shadow-sm relative">
        <div className="relative flex items-center gap-6 text-emerald-600">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">System Status: Optimal</h2>
            <p className="text-sm font-bold text-emerald-600/70 uppercase tracking-widest">All metrics within variance thresholds</p>
          </div>
        </div>
      </section>
    )
  }

  const grouped = groupAnomalies(anomalies)
  const hasHighSeverity = grouped.some((g) => g.severity === "high")

  return (
    <section className={`mb-8 overflow-hidden rounded-[2.5rem] border ${hasHighSeverity ? 'border-rose-100 bg-rose-50/50' : 'border-amber-100 bg-amber-50/50'} p-8 backdrop-blur-xl relative shadow-sm`}>
      <div className="relative mb-8 flex items-center gap-6">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm">
          {hasHighSeverity && (
            <div className="absolute inset-0 rounded-2xl bg-rose-500 animate-ping opacity-10"></div>
          )}
          <svg className={hasHighSeverity ? 'text-rose-500' : 'text-amber-500'} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Active Intelligence Alerts</h2>
          <div className={`text-xs font-bold uppercase tracking-[0.2em] ${hasHighSeverity ? 'text-rose-600' : 'text-amber-600'}`}>
            {anomalies.length} Critical Deviations Detected
          </div>
        </div>
      </div>

      <div className="relative grid gap-6 md:grid-cols-2">
        {grouped.map((group) => (
          <div
            key={group.metric}
            className="group flex flex-col justify-between rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="font-black text-lg text-slate-800 capitalize tracking-tight">{group.metric.replace('_', ' ')}</div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${badgeClass(
                  group.severity
                )}`}
              >
                {group.severity}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Direction</div>
                <div className="font-black text-slate-700 capitalize flex items-center gap-1.5">
                  {group.direction === 'up' ? <span className="text-rose-500">↗</span> : <span className="text-emerald-500">↘</span>}
                  {group.direction}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Magnitude</div>
                <div className="font-black text-slate-700">
                  {group.minChange.toFixed(1)}% {group.minChange !== group.maxChange ? `– ${group.maxChange.toFixed(1)}%` : ''}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
                {group.count} Variance Points
              </div>
              <div>
                {group.startDate} {group.startDate !== group.endDate ? `· ${group.endDate}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}