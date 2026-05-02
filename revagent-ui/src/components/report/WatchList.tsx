"use client"

import { Eye } from "lucide-react"
import type { WatchItem } from "@/lib/types"

interface WatchListProps {
  watchList: WatchItem[]
}

export default function WatchList({ watchList }: WatchListProps) {
  return (
    <section className="space-y-4">
      <div className="text-xl font-semibold text-zinc-50">Watch next</div>

      <div className="space-y-3">
        {watchList.map((item, idx) => (
          <div
            key={`${item.metric}-${idx}`}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
          >
            <div className="mb-2 flex items-center gap-2 text-zinc-100">
              <Eye className="h-4 w-4 text-zinc-400" />
              <span className="font-medium">{item.metric}</span>
            </div>
            <div className="text-sm leading-6 text-zinc-500">{item.reason}</div>
          </div>
        ))}
      </div>
    </section>
  )
}