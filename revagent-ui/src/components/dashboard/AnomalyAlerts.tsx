"use client"

import type { Anomaly } from "@/lib/types"

interface AnomalyAlertsProps {
  anomalies: Anomaly[]
}

function badgeClass(severity: "high" | "medium" | "low") {
  if (severity === "high") {
    return "bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
  }
  if (severity === "medium") {
    return "bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
  }
  return "bg-zinc-800 text-zinc-300 border border-zinc-700"
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
      <section className="mb-8 overflow-hidden rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 backdrop-blur-xl relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent"></div>
        <div className="relative flex items-center gap-4 text-emerald-400">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <span className="font-semibold text-lg">All metrics within normal range</span>
        </div>
      </section>
    )
  }

  const grouped = groupAnomalies(anomalies)
  const hasHighSeverity = grouped.some((g) => g.severity === "high")

  return (
    <section className={`mb-8 overflow-hidden rounded-3xl border ${hasHighSeverity ? 'border-rose-500/20 bg-rose-950/10' : 'border-amber-500/20 bg-amber-950/10'} p-6 md:p-8 backdrop-blur-xl relative`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${hasHighSeverity ? 'from-rose-500/5' : 'from-amber-500/5'} to-transparent`}></div>
      
      <div className="relative mb-6 flex items-center gap-4">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-black/50 border border-white/10 backdrop-blur-md">
          {hasHighSeverity && (
            <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-20"></div>
          )}
          <svg className={hasHighSeverity ? 'text-rose-400' : 'text-amber-400'} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">System Anomalies</h2>
          <div className={`text-sm font-medium ${hasHighSeverity ? 'text-rose-400' : 'text-amber-400'}`}>
            {anomalies.length} deviations requiring attention
          </div>
        </div>
      </div>

      <div className="relative grid gap-4 md:grid-cols-2">
        {grouped.map((group) => (
          <div
            key={group.metric}
            className="group flex flex-col justify-between rounded-2xl border border-white/5 bg-zinc-950/60 p-5 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-white/10 hover:bg-zinc-900/80 shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="font-bold text-lg text-zinc-100 capitalize">{group.metric.replace('_', ' ')}</div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${badgeClass(
                  group.severity
                )}`}
              >
                {group.severity}
              </span>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Direction:</span>
                <span className="font-medium text-zinc-300 capitalize flex items-center gap-1">
                  {group.direction === 'up' ? <span className="text-rose-400">↗</span> : <span className="text-emerald-400">↘</span>}
                  {group.direction}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Magnitude:</span>
                <span className="font-medium text-zinc-300">
                  {group.minChange.toFixed(1)}% {group.minChange !== group.maxChange ? `– ${group.maxChange.toFixed(1)}%` : ''}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
              <div className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
                {group.count} signal{group.count > 1 ? "s" : ""}
              </div>
              <div>
                {group.startDate} {group.startDate !== group.endDate ? `to ${group.endDate}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}