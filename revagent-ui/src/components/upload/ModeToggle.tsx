"use client"

interface ModeToggleProps {
  mode: "recent_issues" | "historical_patterns"
  onChange: (mode: "recent_issues" | "historical_patterns") => void
  disabled?: boolean
}

export default function ModeToggle({
  mode,
  onChange,
  disabled = false,
}: ModeToggleProps) {
  const description =
    mode === "recent_issues"
      ? "Anomalies from the last 7–14 days"
      : "Patterns across your full dataset"

  return (
    <div className="mt-6">
      <div className="mb-3 text-sm font-medium text-zinc-300">Analysis Mode</div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("recent_issues")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === "recent_issues"
              ? "bg-violet-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Recent Issues
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("historical_patterns")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === "historical_patterns"
              ? "bg-violet-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Historical Patterns
        </button>
      </div>

      <div className="mt-2 text-sm text-zinc-500">{description}</div>
    </div>
  )
}