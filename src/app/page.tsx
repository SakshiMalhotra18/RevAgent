"use client"

import { useMemo, useState } from "react"
import { uploadFiles } from "@/lib/api"
import { useAnalysis } from "@/hooks/useAnalysis"
import type { AnalysisResult } from "@/lib/types"

function LoadingState() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 h-8 w-64 animate-pulse rounded bg-zinc-800" />
      <div className="mb-8 h-20 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900"
          />
        ))}
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900" />
        <div className="h-80 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900" />
      </div>
    </div>
  )
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

function UploadPanel({
  onComplete,
}: {
  onComplete: (result: AnalysisResult) => void
}) {
  const [revenue, setRevenue] = useState<File | null>(null)
  const [adSpend, setAdSpend] = useState<File | null>(null)
  const [traffic, setTraffic] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

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

    try {
      await uploadFiles(revenue, adSpend, traffic)
      const result = await mutateAsync()
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

        <button
          onClick={handleRun}
          disabled={!canRun}
          className="mt-6 flex w-full items-center justify-center rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Running analysis..." : "Run Analysis"}
        </button>

        <div className="mt-4 text-sm text-zinc-500">
          Sample CSV downloads will be wired in Phase 2.
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  delta,
}: {
  label: string
  value: string
  delta: string
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-bold text-zinc-50">{value}</div>
      <div className="mt-3 inline-flex rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-sm text-zinc-300">
        {delta}
      </div>
    </div>
  )
}

function Dashboard({ result }: { result: AnalysisResult }) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold tracking-tight text-zinc-50">
            RevAgent
          </div>
          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-sm text-zinc-400">
            Pipeline: ready
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-6 rounded-2xl border-l-4 border-violet-500 bg-zinc-900 p-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-400">
            AI Summary
          </div>
          <div className="text-lg leading-8 text-zinc-100">
            {result.report.summary}
          </div>
          <div className="mt-3 inline-flex rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
            via {result.report.provider_used}
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Net Revenue"
            value={`$${result.kpis.net_revenue.toLocaleString()}`}
            delta={`${result.kpis.net_revenue_delta > 0 ? "↑" : "↓"} ${Math.abs(
              result.kpis.net_revenue_delta
            )}%`}
          />
          <MetricCard
            label="Refund Rate"
            value={`${(result.kpis.refund_rate * 100).toFixed(1)}%`}
            delta={`${result.kpis.refund_rate_delta > 0 ? "↑" : "↓"} ${Math.abs(
              result.kpis.refund_rate_delta
            )}%`}
          />
          <MetricCard
            label="CAC"
            value={`$${result.kpis.cac.toLocaleString()}`}
            delta={`${result.kpis.cac_delta > 0 ? "↑" : "↓"} ${Math.abs(
              result.kpis.cac_delta
            )}`}
          />
          <MetricCard
            label="Churn Rate"
            value={`${(result.kpis.churn_rate * 100).toFixed(1)}%`}
            delta={`${result.kpis.churn_rate_delta > 0 ? "↑" : "↓"} ${Math.abs(
              result.kpis.churn_rate_delta
            )}%`}
          />
        </section>

        <section className="mb-6 rounded-2xl border border-amber-900 bg-amber-950/20 p-6">
          <div className="mb-3 text-sm font-semibold text-amber-400">
            {result.anomalies.length} anomalies detected
          </div>
          <div className="space-y-3">
            {result.anomalies.slice(0, 6).map((anomaly) => (
              <div
                key={`${anomaly.metric}-${anomaly.date}`}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
              >
                <div>
                  <div className="font-medium text-zinc-100">{anomaly.metric}</div>
                  <div className="text-sm text-zinc-500">
                    {anomaly.direction} {Math.abs(anomaly.change_pct).toFixed(1)}% vs
                    30-day average
                  </div>
                </div>
                <div className="text-sm text-zinc-500">{anomaly.date}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 text-lg font-semibold text-zinc-50">Why it happened</div>
            <div className="space-y-4">
              {result.report.drivers.map((driver, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    {driver.confidence}
                  </div>
                  <div className="font-medium text-zinc-100">{driver.hypothesis}</div>
                  <div className="mt-2 text-sm text-zinc-500">{driver.evidence}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 text-lg font-semibold text-zinc-50">What to do</div>
            <div className="space-y-4">
              {result.report.actions.map((action, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    {action.urgency}
                  </div>
                  <div className="font-medium text-zinc-100">{action.action}</div>
                  <div className="mt-2 text-sm text-zinc-500">
                    Owner: {action.owner}
                  </div>
                  <div className="mt-2 text-sm italic text-zinc-500">
                    {action.expected_impact}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default function HomePage() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  if (isAnalyzing) {
    return <LoadingState />
  }

  if (!analysisResult) {
    return (
      <UploadPanel
        onComplete={(result) => {
          setIsAnalyzing(false)
          setAnalysisResult(result)
        }}
      />
    )
  }

  return <Dashboard result={analysisResult} />
}