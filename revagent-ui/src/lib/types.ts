export interface KPIs {
  net_revenue: number
  net_revenue_delta: number
  refund_rate: number
  refund_rate_delta: number
  cac: number
  cac_delta: number
  churn_rate: number
  churn_rate_delta: number
}

export interface Anomaly {
  date: string
  metric: string
  current_value: number
  rolling_mean: number
  change_pct: number
  direction: "up" | "down"
  severity: "high" | "medium" | "low"
  business_impact: string
}

export interface Driver {
  hypothesis: string
  confidence: "high" | "medium" | "low"
  supporting_metrics: string[]
  evidence: string
}

export interface Action {
  action: string
  owner: string
  urgency: "now" | "this_week" | "monitor"
  expected_impact: string
}

export interface Change {
  metric: string
  direction: string
  magnitude: string
  period: string
}

export interface WatchItem {
  metric: string
  reason: string
}

// export interface Report {
//   summary: string
//   changes: Change[]
//   drivers: Driver[]
//   actions: Action[]
//   watch_list: WatchItem[]
//   provider_used: string
// }

export interface Report {
  summary: string
  changes: Change[]
  drivers: Driver[]
  actions: Action[]
  watch_list: WatchItem[]
  provider_used: string
  mode_used: "recent_issues" | "historical_patterns"
  report_type: string
}

// export interface AnalysisResult {
//   status: string
//   report: Report
//   anomalies: Anomaly[]
//   metrics_preview: Record<string, number | string | null>[]
//   kpis: KPIs
// }

export interface AnalysisResult {
  status: string
  mode_used: "recent_issues" | "historical_patterns"
  report_type: string
  report: Report
  anomalies: Anomaly[]
  anomaly_count: number
  metrics_preview: Record<string, number | string | null>[]
  kpis: KPIs
}