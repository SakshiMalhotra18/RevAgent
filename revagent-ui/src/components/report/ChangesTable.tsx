"use client"

import type { Change } from "@/lib/types"

interface ChangesTableProps {
  changes: Change[]
}

function directionCell(change: Change) {
  const dir = change.direction.toLowerCase()

  if (dir === "down") {
    return <span className="font-bold text-rose-600 flex items-center gap-1">↓ Down</span>
  }

  return <span className="font-bold text-emerald-600 flex items-center gap-1">↑ Up</span>
}

export default function ChangesTable({ changes }: ChangesTableProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1.5 rounded-full bg-violet-600"></div>
        <h3 className="text-2xl font-black tracking-tight text-slate-900">Statistical Variances</h3>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-400">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Metric Source</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Direction</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Magnitude</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Target Period</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {changes.map((change, idx) => (
              <tr
                key={`${change.metric}-${idx}`}
                className="transition-colors hover:bg-slate-50/50"
              >
                <td className="px-6 py-4 font-bold text-slate-700 capitalize">{change.metric.replace('_', ' ')}</td>
                <td className="px-6 py-4">{directionCell(change)}</td>
                <td className="px-6 py-4 font-black text-slate-900">
                  {change.magnitude}
                </td>
                <td className="px-6 py-4 font-medium text-slate-400">{change.period}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}