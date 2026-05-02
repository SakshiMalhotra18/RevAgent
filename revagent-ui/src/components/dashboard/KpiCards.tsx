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
      text: `${positive ? "↗" : "↘"} ${Math.abs(delta).toFixed(1)}%`,
      textColor: positive ? "text-emerald-400" : "text-rose-400",
      bgGradient: positive ? "from-emerald-500/10 to-transparent" : "from-rose-500/10 to-transparent",
      shadowColor: positive ? "group-hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]" : "group-hover:shadow-[0_0_20px_rgba(251,113,133,0.15)]",
      borderColor: positive ? "border-emerald-500/30" : "border-rose-500/30",
      glowColor: positive ? "bg-emerald-500" : "bg-rose-500",
    }
  }

  const worse = delta > 0
  return {
    text: `${worse ? "↗" : "↘"} ${Math.abs(delta).toFixed(1)}${label === "CAC" ? "" : "%"}`,
    textColor: worse ? "text-rose-400" : "text-emerald-400",
    bgGradient: worse ? "from-rose-500/10 to-transparent" : "from-emerald-500/10 to-transparent",
    shadowColor: worse ? "group-hover:shadow-[0_0_20px_rgba(251,113,133,0.15)]" : "group-hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]",
    borderColor: worse ? "border-rose-500/30" : "border-emerald-500/30",
    glowColor: worse ? "bg-rose-500" : "bg-emerald-500",
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
    <div className={`group relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-950/80 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${meta.shadowColor}`}>
      {/* Dynamic Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${meta.bgGradient} opacity-50`} />
      
      {/* Top glowing edge indicator */}
      <div className={`absolute left-0 top-0 h-1 w-full ${meta.glowColor} opacity-50 transition-all duration-500 group-hover:opacity-100`} />
      
      <div className="relative z-10 flex justify-between items-start">
        <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 transition-colors group-hover:text-zinc-300">
          {label}
        </div>
        <div className={`flex items-center gap-1.5 rounded-full border ${meta.borderColor} bg-black/40 px-2.5 py-1 text-[11px] font-bold tracking-wide ${meta.textColor} backdrop-blur-md`}>
          <span>{meta.text}</span>
        </div>
      </div>
      
      <div className="relative z-10 mt-6 flex items-baseline gap-2">
        <div className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">{value}</div>
      </div>
    </div>
  )
}

export default function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <section className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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