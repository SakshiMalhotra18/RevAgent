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
    <div className="mx-auto max-w-7xl px-6 py-20 relative z-10 flex flex-col items-center">
      <div className="h-2 w-64 bg-slate-100 rounded-full overflow-hidden mb-12">
        <div className="h-full bg-violet-600 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '30%' }}></div>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-black text-slate-900 mb-2">Analyzing Business Pulse</h2>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Applying AI Statistical Modeling...</p>
      </div>
      
      <div className="mt-16 w-full grid gap-8 opacity-40">
        <div className="h-24 animate-pulse rounded-[2rem] border border-slate-200 bg-white" />
        <div className="grid gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          ))}
        </div>
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
    <div className="min-h-screen bg-transparent relative z-10">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <BusinessPulse report={analysisResult.report} />
        <SummaryBanner report={analysisResult.report} />

        <KpiCards kpis={analysisResult.kpis} />

        <section className="mb-8 grid gap-8 lg:grid-cols-2">
          <RevenueChart
            data={analysisResult.metrics_preview}
            anomalyDates={anomalyDates}
          />
          <AdSpendChart data={analysisResult.metrics_preview} />
        </section>

        <section className="mb-8 grid gap-8 lg:grid-cols-2">
          <CacChart data={analysisResult.metrics_preview} />
          <RefundChart data={analysisResult.metrics_preview} />
        </section>

        <AnomalyAlerts anomalies={analysisResult.anomalies} />

        <section className="mt-16 mb-20">
          <div className="mb-8 flex items-center justify-between">
             <div className="flex p-1.5 gap-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <button
                onClick={() => setActiveTab("report")}
                className={`rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === "report"
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Intelligence Report
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                className={`rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === "raw"
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Processed Data
              </button>
            </div>
          </div>

          {activeTab === "report" ? (
            <div className="space-y-16">
              <ChangesTable changes={analysisResult.report.changes} />
              <DriversSection drivers={analysisResult.report.drivers} />
              <ActionsSection actions={analysisResult.report.actions} />
              <WatchList watchList={analysisResult.report.watch_list} />
            </div>
          ) : (
            <div className="rounded-[2.5rem] border border-slate-200 bg-white overflow-hidden shadow-sm">
              <RawDataTable data={analysisResult.metrics_preview} />
            </div>
          )}

          <DownloadActions metrics={analysisResult.metrics_preview} />
        </section>
      </main>
    </div>
  )
}