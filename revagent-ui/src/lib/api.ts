import type { AnalysisResult, Report } from "@/lib/types"

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`

    try {
      const data = await response.json()
      detail = data.detail || detail
    } catch {
      // ignore json parse failure
    }

    throw new Error(detail)
  }

  return response.json() as Promise<T>
}

export async function uploadFiles(
  revenue: File,
  adSpend: File,
  traffic: File
): Promise<{ status: string; message?: string }> {
  const formData = new FormData()
  formData.append("revenue", revenue)
  formData.append("ad_spend", adSpend)
  formData.append("traffic", traffic)

  const response = await fetch(`${BASE}/api/upload`, {
    method: "POST",
    body: formData,
  })

  return handleResponse<{ status: string; message?: string }>(response)
}

// export async function runAnalysis(): Promise<AnalysisResult> {
//   const response = await fetch(`${BASE}/api/analyze`, {
//     method: "POST",
//   })

//   return handleResponse<AnalysisResult>(response)
// }

export async function runAnalysis(
  mode: "recent_issues" | "historical_patterns" = "recent_issues"
): Promise<AnalysisResult> {
  const response = await fetch(`${BASE}/api/analyze?mode=${mode}`, {
    method: "POST",
  })

  return handleResponse<AnalysisResult>(response)
}

export async function getReport(): Promise<Report> {
  const response = await fetch(`${BASE}/api/report`, {
    method: "GET",
    cache: "no-store",
  })

  return handleResponse<Report>(response)
}

export async function getMetrics(): Promise<Record<string, unknown>[]> {
  const response = await fetch(`${BASE}/api/metrics`, {
    method: "GET",
    cache: "no-store",
  })

  return handleResponse<Record<string, unknown>[]>(response)
}

export async function downloadPdf(): Promise<Blob> {
  const response = await fetch(`${BASE}/api/report/pdf`, {
    method: "GET",
  })

  if (!response.ok) {
    let detail = `Download failed with status ${response.status}`

    try {
      const data = await response.json()
      detail = data.detail || detail
    } catch {
      // ignore parse failure
    }

    throw new Error(detail)
  }

  return response.blob()
}