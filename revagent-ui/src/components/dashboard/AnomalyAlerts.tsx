"use client"

import type { Anomaly } from "@/lib/types"

interface AnomalyAlertsProps {
  anomalies: Anomaly[]
}

function badgeClass(severity: "high" | "medium" | "low") {
  if (severity === "high") {
    return "bg-red-500/15 text-red-400 border border-red-500/30"
  }
  if (severity === "medium") {
    return "bg-amber-500/15 text-amber-400 border border-amber-500/30"
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
      <section className="mb-6 rounded-2xl border border-green-900 bg-green-950/20 p-4 text-green-400">
        All metrics within normal range
      </section>
    )
  }

  const grouped = groupAnomalies(anomalies)

  return (
    <section className="mb-6 rounded-2xl border border-amber-900 bg-amber-950/20 p-6">
      <div className="mb-4 text-sm font-semibold text-amber-400">
        {anomalies.length} anomalies detected
      </div>

      <div className="space-y-3">
        {grouped.map((group) => (
          <div
            key={group.metric}
            className="flex items-start justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-4"
          >
            <div className="flex items-start gap-3">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${badgeClass(
                  group.severity
                )}`}
              >
                {group.severity}
              </span>

              <div>
                <div className="font-medium text-zinc-100">{group.metric}</div>
                <div className="text-sm text-zinc-500">
                  {group.direction} {group.minChange.toFixed(1)}–{group.maxChange.toFixed(1)}% across{" "}
                  {group.count} signal{group.count > 1 ? "s" : ""}
                </div>
              </div>
            </div>

            <div className="text-right text-sm text-zinc-500">
              <div>{group.startDate}</div>
              {group.startDate !== group.endDate ? <div>to {group.endDate}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}