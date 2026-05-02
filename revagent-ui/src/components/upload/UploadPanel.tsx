"use client"

import { useMemo, useState } from "react"
import { uploadFiles } from "@/lib/api"
import { useAnalysis } from "@/hooks/useAnalysis"
import type { AnalysisResult } from "@/lib/types"
import ModeToggle from "@/components/upload/ModeToggle"

interface UploadPanelProps {
  onComplete: (result: AnalysisResult) => void
  onStart?: () => void
}

function UploadBox({
  label,
  file,
  onChange,
}: {
  label: string
  file: File | null
  onChange: (file: File | null) => void
}) {
  return (
    <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/60 p-6 text-center transition hover:border-violet-500 hover:bg-zinc-900">
      <div className="mb-2 text-sm font-medium text-zinc-300">{label}</div>
      <div className="text-sm text-zinc-500">
        {file ? `✓ ${file.name}` : "Click to browse CSV"}
      </div>
      <input
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  )
}

export default function UploadPanel({
  onComplete,
  onStart,
}: UploadPanelProps) {
  const [revenue, setRevenue] = useState<File | null>(null)
  const [adSpend, setAdSpend] = useState<File | null>(null)
  const [traffic, setTraffic] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"recent_issues" | "historical_patterns">(
  "recent_issues"
)

  const { mutateAsync, isPending } = useAnalysis()

  const canRun = useMemo(
    () => Boolean(revenue && adSpend && traffic) && !isPending,
    [revenue, adSpend, traffic, isPending]
  )

  const handleRun = async () => {
    if (!revenue || !adSpend || !traffic) {
      setError("Please upload all 3 CSV files.")
      return
    }

    setError(null)
    onStart?.()

    try {
      await uploadFiles(revenue, adSpend, traffic)
      const result = await mutateAsync(mode)
      onComplete(result)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload or analysis failed."
      setError(message)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-16">
      <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <div className="mb-2 text-4xl font-bold tracking-tight text-zinc-50">
          Rev<span className="text-violet-500">Agent</span>
        </div>
        <p className="mb-8 text-zinc-500">
          Upload your business data. Get AI analyst insight.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <UploadBox label="Revenue CSV" file={revenue} onChange={setRevenue} />
          <UploadBox label="Ad Spend CSV" file={adSpend} onChange={setAdSpend} />
          <UploadBox label="Traffic CSV" file={traffic} onChange={setTraffic} />
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}
        <ModeToggle mode={mode} onChange={setMode} disabled={isPending} />
        <button
          onClick={handleRun}
          disabled={!canRun}
          className="mt-6 flex w-full items-center justify-center rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Running analysis..." : "Run Analysis"}
        </button>

        <div className="mt-4 text-sm text-zinc-500">
          Sample CSV downloads can be added next if needed.
        </div>
      </div>
    </div>
  )
}