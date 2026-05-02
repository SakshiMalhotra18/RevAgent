"use client"

import type { Action } from "@/lib/types"

interface ActionsSectionProps {
  actions: Action[]
}

function urgencyClass(urgency: Action["urgency"]) {
  if (urgency === "now") {
    return {
      badge: "bg-rose-100 text-rose-700 border-rose-200",
      card: "bg-white border-rose-100 shadow-rose-500/5",
    }
  }
  if (urgency === "this_week") {
    return {
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      card: "bg-white border-amber-100 shadow-amber-500/5",
    }
  }
  return {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    card: "bg-white border-slate-200 shadow-slate-500/5",
  }
}

function renderGroup(title: string, items: Action[]) {
  if (!items.length) return null

  return (
    <div className="space-y-4">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
        Timeline: {title}
      </div>

      {items.map((action, idx) => {
        const styles = urgencyClass(action.urgency)

        return (
          <div
            key={`${title}-${idx}`}
            className={`rounded-[2rem] border-2 p-8 shadow-sm transition-all hover:shadow-md ${styles.card}`}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${styles.badge}`}
              >
                {action.urgency.replace('_', ' ')}
              </span>
            </div>

            <div className="text-lg font-bold leading-relaxed text-slate-800">
              {action.action}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                {action.owner.substring(0, 1).toUpperCase()}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Owner: {action.owner}
              </span>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm italic font-medium text-slate-500 border border-slate-100">
              <span className="not-italic font-bold text-slate-400 mr-2">Impact:</span>
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
    <section className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1.5 rounded-full bg-violet-600"></div>
        <h3 className="text-2xl font-black tracking-tight text-slate-900">Strategic Response</h3>
      </div>
      
      {renderGroup("Immediate", now)}
      {renderGroup("Short Term", thisWeek)}
      {renderGroup("Observation", monitor)}
    </section>
  )
}