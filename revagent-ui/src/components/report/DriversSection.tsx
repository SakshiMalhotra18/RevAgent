"use client"

import type { Driver } from "@/lib/types"

interface DriversSectionProps {
  drivers: Driver[]
}

function borderClass(confidence: Driver["confidence"]) {
  if (confidence === "high") return "border-l-red-500"
  if (confidence === "medium") return "border-l-amber-500"
  return "border-l-zinc-500"
}

function badgeClass(confidence: Driver["confidence"]) {
  if (confidence === "high") {
    return "bg-red-500/15 text-red-400 border border-red-500/30"
  }
  if (confidence === "medium") {
    return "bg-amber-500/15 text-amber-400 border border-amber-500/30"
  }
  return "bg-zinc-800 text-zinc-300 border border-zinc-700"
}

export default function DriversSection({ drivers }: DriversSectionProps) {
  return (
    <section className="space-y-4">
      <div className="text-xl font-semibold text-zinc-50">Why it happened</div>

      {drivers.map((driver, idx) => (
        <div
          key={idx}
          className={`rounded-2xl border border-zinc-800 border-l-4 bg-zinc-900 p-6 ${borderClass(
            driver.confidence
          )}`}
        >
          <div className="mb-3 flex items-start justify-between gap-4">
            <div className="font-medium leading-7 text-zinc-100">
              {driver.hypothesis}
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${badgeClass(driver.confidence)}`}>
              {driver.confidence}
            </span>
          </div>

          <div className="mb-4 text-sm leading-6 text-zinc-500">
            {driver.evidence}
          </div>

          <div className="flex flex-wrap gap-2">
            {driver.supporting_metrics.map((metric) => (
              <span
                key={metric}
                className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
              >
                {metric}
              </span>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}