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
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <button
        onClick={handlePdfDownload}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
      >
        Download PDF Report
      </button>

      <button
        onClick={handleCsvDownload}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800"
      >
        Download CSV Data
      </button>
    </div>
  )
}