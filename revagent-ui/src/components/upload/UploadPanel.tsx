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
    <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/60 p-6 text-center transition-all duration-300 hover:border-violet-500 hover:bg-violet-950/20 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)]">
      <div className="mb-2 text-sm font-medium text-zinc-300">{label}</div>
      <div className="text-sm text-zinc-500">
        {file ? (
          <span className="text-violet-400 font-medium">✓ {file.name}</span>
        ) : (
          "Click to browse CSV"
        )}
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
  const [isLoadingSample, setIsLoadingSample] = useState(false)
  const [mode, setMode] = useState<"recent_issues" | "historical_patterns">(
    "recent_issues"
  )

  const { mutateAsync, isPending } = useAnalysis()

  const canRun = useMemo(
    () => Boolean(revenue && adSpend && traffic) && !isPending && !isLoadingSample,
    [revenue, adSpend, traffic, isPending, isLoadingSample]
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

  const loadSampleData = async () => {
    setError(null)
    setIsLoadingSample(true)
    onStart?.()

    try {
      // Simulate network delay for a more realistic feel
      await new Promise(res => setTimeout(res, 1200))
      
      const res = await fetch("/sample-data.json")
      if (!res.ok) throw new Error("Failed to load sample data.")
      const data = await res.json()
      
      onComplete(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load sample data."
      setError(message)
      setIsLoadingSample(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <div className="w-full relative">
        {/* Glow effect behind the panel */}
        <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-violet-600 to-indigo-600 opacity-20 blur-xl"></div>
        
        <div className="relative rounded-3xl border border-white/10 bg-zinc-950/80 p-8 backdrop-blur-xl md:p-12 shadow-2xl">
          <div className="text-center mb-10">
            <h1 className="mb-3 text-5xl font-extrabold tracking-tight text-white">
              Rev<span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Agent</span>
            </h1>
            <p className="text-lg text-zinc-400">
              Upload your business data. Get AI analyst insight.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3 mb-8">
            <UploadBox label="Revenue CSV" file={revenue} onChange={setRevenue} />
            <UploadBox label="Ad Spend CSV" file={adSpend} onChange={setAdSpend} />
            <UploadBox label="Traffic CSV" file={traffic} onChange={setTraffic} />
          </div>

          {error ? (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}
          
          <div className="mb-8">
            <ModeToggle mode={mode} onChange={setMode} disabled={isPending || isLoadingSample} />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleRun}
              disabled={!canRun}
              className="flex flex-1 items-center justify-center rounded-xl bg-violet-600 px-6 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:bg-violet-500 hover:shadow-violet-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Running Analysis..." : "Run Analysis"}
            </button>
            
            <button
              onClick={loadSampleData}
              disabled={isPending || isLoadingSample}
              className="flex flex-1 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-4 text-sm font-semibold text-zinc-300 shadow-lg transition-all hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoadingSample ? "Loading Sample..." : "Load Sample Data"}
            </button>
          </div>
          
          <div className="mt-8 text-center text-xs text-zinc-500">
            Click &quot;Load Sample Data&quot; to see how RevAgent works instantly.
          </div>
        </div>
      </div>
    </div>
  )
}