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
      textColor: positive ? "text-emerald-600" : "text-rose-600",
      bgGradient: positive ? "from-emerald-50 to-transparent" : "from-rose-50 to-transparent",
      shadowColor: positive ? "hover:shadow-emerald-500/10" : "hover:shadow-rose-500/10",
      borderColor: positive ? "border-emerald-100" : "border-rose-100",
      glowColor: positive ? "bg-emerald-500" : "bg-rose-500",
    }
  }

  const worse = delta > 0
  return {
    text: `${worse ? "↗" : "↘"} ${Math.abs(delta).toFixed(1)}${label === "CAC" ? "" : "%"}`,
    textColor: worse ? "text-rose-600" : "text-emerald-600",
    bgGradient: worse ? "from-rose-50 to-transparent" : "from-emerald-50 to-transparent",
    shadowColor: worse ? "hover:shadow-rose-500/10" : "hover:shadow-emerald-500/10",
    borderColor: worse ? "border-rose-100" : "border-emerald-100",
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
    <div className={`group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${meta.shadowColor}`}>
      {/* Dynamic Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${meta.bgGradient} opacity-40`} />
      
      {/* Top glowing edge indicator */}
      <div className={`absolute left-0 top-0 h-1.5 w-full ${meta.glowColor} opacity-20 transition-all duration-500 group-hover:opacity-100`} />
      
      <div className="relative z-10 flex justify-between items-start">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-colors group-hover:text-slate-500">
          {label}
        </div>
        <div className={`flex items-center gap-1 rounded-full border ${meta.borderColor} bg-white/80 px-2 py-0.5 text-[10px] font-black tracking-wide ${meta.textColor} backdrop-blur-md`}>
          <span>{meta.text}</span>
        </div>
      </div>
      
      <div className="relative z-10 mt-6 flex items-baseline gap-2">
        <div className="text-4xl font-black tracking-tight text-slate-900 drop-shadow-sm">{value}</div>
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