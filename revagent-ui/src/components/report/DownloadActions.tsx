"use client"

import { downloadPdf } from "@/lib/api"

interface DownloadActionsProps {
  metrics: Record<string, number | string | null>[]
}

export default function DownloadActions({ metrics }: DownloadActionsProps) {
  const handleCsvDownload = () => {
    if (!metrics.length) return

    const headers = Object.keys(metrics[0])
    const rows = metrics.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          if (value === null || value === undefined) return ""
          const text = String(value).replace(/"/g, '""')
          return `"${text}"`
        })
        .join(",")
    )

    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "metrics_preview.csv"
    a.click()

    URL.revokeObjectURL(url)
  }

  const handlePdfDownload = async () => {
    try {
      const blob = await downloadPdf()
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = "revagent_report.pdf"
      a.click()

      URL.revokeObjectURL(url)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "PDF download failed."
      alert(message)
    }
  }

  return (
    <div className="mt-12 flex flex-col gap-4 sm:flex-row">
      <button
        onClick={handlePdfDownload}
        className="flex-1 rounded-2xl bg-violet-600 px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 hover:shadow-violet-600/40"
      >
        Export PDF Report
      </button>

      <button
        onClick={handleCsvDownload}
        className="flex-1 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-slate-600 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
      >
        Download CSV Data
      </button>
    </div>
  )
}