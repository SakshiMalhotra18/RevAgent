"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"

import { getReport, runAnalysis } from "@/lib/api"
import type { AnalysisResult, Report } from "@/lib/types"

export function useAnalysis() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  const mutation = useMutation({
    mutationFn: runAnalysis,
    onSuccess: (data) => {
      setAnalysisResult(data)
    },
  })

  return {
    analysisResult,
    setAnalysisResult,
    ...mutation,
  }
}

export function useReport(enabled = false) {
  return useQuery<Report>({
    queryKey: ["latest-report"],
    queryFn: getReport,
    enabled,
    retry: false,
  })
}