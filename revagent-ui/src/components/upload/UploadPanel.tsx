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
    <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center transition-all duration-300 hover:border-violet-400 hover:bg-slate-50 hover:shadow-sm">
      <div className="mb-2 text-sm font-semibold text-slate-700">{label}</div>
      <div className="text-sm text-slate-500">
        {file ? (
          <span className="text-violet-600 font-semibold">✓ {file.name}</span>
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
        {/* Subtle shadow glow behind the panel */}
        <div className="absolute -inset-4 rounded-[3rem] bg-violet-600/5 blur-3xl opacity-50"></div>
        
        <div className="relative rounded-[2.5rem] border border-slate-200 bg-white/90 p-8 backdrop-blur-2xl md:p-12 shadow-xl">
          <div className="text-center mb-10">
            <h1 className="mb-3 text-5xl font-black tracking-tight text-slate-900">
              Rev<span className="text-violet-600">Agent</span>
            </h1>
            <p className="text-lg font-medium text-slate-500">
              Transform raw metrics into actionable AI intelligence.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3 mb-10">
            <UploadBox label="Revenue CSV" file={revenue} onChange={setRevenue} />
            <UploadBox label="Ad Spend CSV" file={adSpend} onChange={setAdSpend} />
            <UploadBox label="Traffic CSV" file={traffic} onChange={setTraffic} />
          </div>

          {error ? (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}
          
          <div className="mb-10 flex flex-col items-center">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Analysis Mode</div>
            <ModeToggle mode={mode} onChange={setMode} disabled={isPending || isLoadingSample} />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleRun}
              disabled={!canRun}
              className="flex flex-[1.5] items-center justify-center rounded-2xl bg-violet-600 px-6 py-5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition-all hover:bg-violet-700 hover:shadow-violet-600/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Analysing Data..." : "Generate Analysis"}
            </button>
            
            <button
              onClick={loadSampleData}
              disabled={isPending || isLoadingSample}
              className="flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 text-sm font-bold text-slate-600 transition-all hover:bg-white hover:border-slate-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoadingSample ? "Loading..." : "Load Sample Data"}
            </button>
          </div>
          
          <div className="mt-8 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Secure · Private · AI-Powered
          </div>
        </div>
      </div>
    </div>
  )
}