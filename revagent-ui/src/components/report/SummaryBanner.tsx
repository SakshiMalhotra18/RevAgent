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
    <section className="mb-8 relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 p-8 backdrop-blur-xl shadow-2xl">
      {/* Decorative background glow */}
      <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl"></div>
      <div className="absolute -right-32 -bottom-32 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl"></div>

      <div className="relative">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-500/30">
              <svg className="text-violet-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20"></path>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">AI Analyst Summary</h2>
              <div className="text-xs font-medium text-zinc-400">Powered by {report.provider_used}</div>
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold tracking-wide uppercase ${
              isHistorical
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
          >
            {report.report_type}
          </span>
        </div>

        <div className="relative rounded-2xl border border-white/5 bg-black/40 p-6 backdrop-blur-md">
          <div className="text-lg leading-relaxed text-zinc-200">
            {report.summary}
          </div>
        </div>
      </div>
    </section>
  )
}