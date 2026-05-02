"use client"

import type { Change } from "@/lib/types"

interface ChangesTableProps {
  changes: Change[]
}

function directionCell(change: Change) {
  const dir = change.direction.toLowerCase()

  if (dir === "down") {
    return <span className="font-medium text-red-400">↓ Down</span>
  }

  return <span className="font-medium text-green-400">↑ Up</span>
}

export default function ChangesTable({ changes }: ChangesTableProps) {
  return (
    <section className="space-y-4">
      <div className="text-xl font-semibold text-zinc-50">What changed</div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-zinc-900">
            <tr className="text-left text-zinc-400">
              <th className="px-4 py-3 font-medium">Metric</th>
              <th className="px-4 py-3 font-medium">Direction</th>
              <th className="px-4 py-3 font-medium">Magnitude</th>
              <th className="px-4 py-3 font-medium">Period</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((change, idx) => (
              <tr
                key={`${change.metric}-${idx}`}
                className={idx % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900"}
              >
                <td className="px-4 py-3 text-zinc-100">{change.metric}</td>
                <td className="px-4 py-3">{directionCell(change)}</td>
                <td className="px-4 py-3 font-semibold text-zinc-100">
                  {change.magnitude}
                </td>
                <td className="px-4 py-3 text-zinc-400">{change.period}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}