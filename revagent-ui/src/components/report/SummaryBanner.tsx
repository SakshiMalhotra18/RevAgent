// "use client"

// import type { Report } from "@/lib/types"

// interface SummaryBannerProps {
//   report: Report
// }

// export default function SummaryBanner({ report }: SummaryBannerProps) {
//   return (
//     <section className="mb-6 rounded-2xl border border-zinc-800 border-l-4 border-l-violet-500 bg-zinc-900 p-6">
//       <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-400">
//         AI Summary
//       </div>

//       <div className="text-lg leading-8 text-zinc-100">{report.summary}</div>

//       <div className="mt-3 inline-flex rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
//         via {report.provider_used}
//       </div>
//     </section>
//   )
// }

"use client"

import type { Report } from "@/lib/types"

interface SummaryBannerProps {
  report: Report
}

export default function SummaryBanner({ report }: SummaryBannerProps) {
  const isHistorical = report.mode_used === "historical_patterns"

  return (
    <section className="mb-6 rounded-2xl border border-zinc-800 border-l-4 border-l-violet-500 bg-zinc-900 p-6">
      <div className="mb-2 flex items-center gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-violet-400">
          AI Summary
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            isHistorical
              ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
              : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
          }`}
        >
          {report.report_type}
        </span>
      </div>

      <div className="text-lg leading-8 text-zinc-100">{report.summary}</div>

      <div className="mt-3 inline-flex rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
        via {report.provider_used}
      </div>
    </section>
  )
}