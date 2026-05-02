"use client"

import type { KPIs } from "@/lib/types"

interface KpiCardsProps {
  kpis: KPIs
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

function formatPercent(value: number, raw = false) {
  if (raw) return `${value.toFixed(1)}%`
  return `${(value * 100).toFixed(1)}%`
}

function getDeltaMeta(label: string, delta: number) {
  const isRevenue = label === "Net Revenue"

  if (isRevenue) {
    const positive = delta >= 0
    return {
      text: `${positive ? "↑" : "↓"} ${Math.abs(delta).toFixed(1)}%`,
      textColor: positive ? "text-green-400" : "text-red-400",
      borderColor: positive ? "border-l-green-500" : "border-l-red-500",
    }
  }

  const worse = delta > 0
  return {
    text: `${worse ? "↑" : "↓"} ${Math.abs(delta).toFixed(1)}${label === "CAC" ? "" : "%"}`,
    textColor: worse ? "text-red-400" : "text-green-400",
    borderColor: worse ? "border-l-red-500" : "border-l-green-500",
  }
}

function CardItem({
  label,
  value,
  delta,
}: {
  label: string
  value: string
  delta: number
}) {
  const meta = getDeltaMeta(label, delta)

  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900`}>
      <div className={`absolute top-0 left-0 h-full w-1 ${meta.borderColor.replace('border-l-', 'bg-')}`} />
      <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 transition-colors group-hover:text-zinc-400">
        {label}
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight text-zinc-50">{value}</div>
      <div className={`mt-4 inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/50 px-3 py-1 text-xs font-medium ${meta.textColor}`}>
        <span className="opacity-70">{meta.text.split(' ')[0]}</span>
        {meta.text.split(' ')[1]}
      </div>
    </div>
  )
}

export default function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <CardItem
        label="Net Revenue"
        value={formatCurrency(kpis.net_revenue)}
        delta={kpis.net_revenue_delta}
      />
      <CardItem
        label="Refund Rate"
        value={formatPercent(kpis.refund_rate)}
        delta={kpis.refund_rate_delta}
      />
      <CardItem
        label="CAC"
        value={formatCurrency(kpis.cac)}
        delta={kpis.cac_delta}
      />
      <CardItem
        label="Churn Rate"
        value={formatPercent(kpis.churn_rate)}
        delta={kpis.churn_rate_delta}
      />
    </section>
  )
}