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
    <section className="mb-8 relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 backdrop-blur-xl shadow-xl shadow-slate-200/40">
      {/* Decorative background glow - softer for light mode */}
      <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-violet-500/5 blur-3xl"></div>
      <div className="absolute -right-32 -bottom-32 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl"></div>

      <div className="relative">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-600/20">
              <svg className="text-white" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20"></path>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">AI Intelligence Report</h2>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Analysis Engine: {report.provider_used}</div>
            </div>
          </div>

          <span
            className={`rounded-full px-4 py-2 text-[10px] font-bold tracking-widest uppercase border ${
              isHistorical
                ? "bg-violet-50 text-violet-600 border-violet-100"
                : "bg-amber-50 text-amber-600 border-amber-100"
            }`}
          >
            {report.report_type}
          </span>
        </div>

        <div className="relative rounded-3xl border border-slate-100 bg-slate-50/50 p-8 backdrop-blur-md">
          <div className="text-lg font-medium leading-relaxed text-slate-600">
            {report.summary}
          </div>
        </div>
      </div>
    </section>
  )
}