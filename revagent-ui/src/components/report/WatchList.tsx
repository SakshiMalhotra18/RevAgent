"use client"

import { Eye } from "lucide-react"
import type { WatchItem } from "@/lib/types"

interface WatchListProps {
  watchList: WatchItem[]
}

export default function WatchList({ watchList }: WatchListProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1.5 rounded-full bg-violet-600"></div>
        <h3 className="text-2xl font-black tracking-tight text-slate-900">Priority Watchlist</h3>
      </div>

      <div className="grid gap-4">
        {watchList.map((item, idx) => (
          <div
            key={`${item.metric}-${idx}`}
            className="group rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-violet-300 hover:shadow-md"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition-colors group-hover:bg-violet-50 group-hover:text-violet-600">
                <Eye className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-800 capitalize">{item.metric.replace('_', ' ')}</span>
            </div>
            <div className="text-sm font-medium leading-relaxed text-slate-500">{item.reason}</div>
          </div>
        ))}
      </div>
    </section>
  )
}