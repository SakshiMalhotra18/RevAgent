"use client"

import type { Action } from "@/lib/types"

interface ActionsSectionProps {
  actions: Action[]
}

function urgencyClass(urgency: Action["urgency"]) {
  if (urgency === "now") {
    return {
      badge: "bg-red-500/15 text-red-400 border border-red-500/30",
      card: "bg-zinc-900 border-zinc-700",
    }
  }
  if (urgency === "this_week") {
    return {
      badge: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
      card: "bg-zinc-900 border-zinc-800",
    }
  }
  return {
    badge: "bg-zinc-800 text-zinc-300 border border-zinc-700",
    card: "bg-zinc-900 border-zinc-800",
  }
}

function renderGroup(title: string, items: Action[]) {
  if (!items.length) return null

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </div>

      {items.map((action, idx) => {
        const styles = urgencyClass(action.urgency)

        return (
          <div
            key={`${title}-${idx}`}
            className={`rounded-2xl border p-5 ${styles.card}`}
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${styles.badge}`}
              >
                {action.urgency}
              </span>
            </div>

            <div className="text-base font-medium leading-7 text-zinc-100">
              {action.action}
            </div>

            <div className="mt-3">
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                {action.owner}
              </span>
            </div>

            <div className="mt-3 text-sm italic leading-6 text-zinc-500">
              {action.expected_impact}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ActionsSection({ actions }: ActionsSectionProps) {
  const now = actions.filter((a) => a.urgency === "now")
  const thisWeek = actions.filter((a) => a.urgency === "this_week")
  const monitor = actions.filter((a) => a.urgency === "monitor")

  return (
    <section className="space-y-6">
      <div className="text-xl font-semibold text-zinc-50">What to do</div>
      {renderGroup("Now", now)}
      {renderGroup("This Week", thisWeek)}
      {renderGroup("Monitor", monitor)}
    </section>
  )
}