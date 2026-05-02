"use client"

import { useState } from "react"

import type { AnalysisResult } from "@/lib/types"

import Header from "@/components/layout/Header"
import BusinessPulse from "@/components/dashboard/BusinessPulse"
import UploadPanel from "@/components/upload/UploadPanel"
import SummaryBanner from "@/components/report/SummaryBanner"
import KpiCards from "@/components/dashboard/KpiCards"
import AnomalyAlerts from "@/components/dashboard/AnomalyAlerts"
import RevenueChart from "@/components/dashboard/RevenueChart"
import AdSpendChart from "@/components/dashboard/AdSpendChart"
import CacChart from "@/components/dashboard/CacChart"
import RefundChart from "@/components/dashboard/RefundChart"
import ChangesTable from "@/components/report/ChangesTable"
import DriversSection from "@/components/report/DriversSection"
import ActionsSection from "@/components/report/ActionsSection"
import WatchList from "@/components/report/WatchList"
import RawDataTable from "@/components/report/RawDataTable"
import DownloadActions from "@/components/report/DownloadActions"

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

export default function HomePage() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<"report" | "raw">("report")

  if (isAnalyzing) {
    return <LoadingState />
  }

  if (!analysisResult) {
    return (
      <UploadPanel
        onStart={() => setIsAnalyzing(true)}
        onComplete={(result) => {
          setIsAnalyzing(false)
          setAnalysisResult(result)
        }}
      />
    )
  }

  const anomalyDates = [...new Set(analysisResult.anomalies.map((a) => a.date))]

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <BusinessPulse report={analysisResult.report} />
        <SummaryBanner report={analysisResult.report} />

        <KpiCards kpis={analysisResult.kpis} />

        <section className="mb-6 grid gap-6 lg:grid-cols-2">
          <RevenueChart
            data={analysisResult.metrics_preview}
            anomalyDates={anomalyDates}
          />
          <AdSpendChart data={analysisResult.metrics_preview} />
        </section>

        <section className="mb-6 grid gap-6 lg:grid-cols-2">
          <CacChart data={analysisResult.metrics_preview} />
          <RefundChart data={analysisResult.metrics_preview} />
        </section>

        <AnomalyAlerts anomalies={analysisResult.anomalies} />

        <section className="mb-6">
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setActiveTab("report")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === "report"
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              Report
            </button>
            <button
              onClick={() => setActiveTab("raw")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === "raw"
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              Raw Data
            </button>
          </div>

          {activeTab === "report" ? (
            <div className="space-y-8">
              <ChangesTable changes={analysisResult.report.changes} />
              <DriversSection drivers={analysisResult.report.drivers} />
              <ActionsSection actions={analysisResult.report.actions} />
              <WatchList watchList={analysisResult.report.watch_list} />
            </div>
          ) : (
            <RawDataTable data={analysisResult.metrics_preview} />
          )}

          <DownloadActions metrics={analysisResult.metrics_preview} />
        </section>
      </main>
    </div>
  )
}