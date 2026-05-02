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
      ? "Focusing on anomalies from the last 14 days"
      : "Extracting patterns across your entire history"

  return (
    <div className="w-full">
      <div className="flex p-1.5 gap-1.5 rounded-2xl bg-slate-100/50 border border-slate-200">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("recent_issues")}
          className={`flex-1 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${
            mode === "recent_issues"
              ? "bg-white text-violet-600 shadow-sm"
              : "text-slate-400 hover:text-slate-600"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Recent Issues
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("historical_patterns")}
          className={`flex-1 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${
            mode === "historical_patterns"
              ? "bg-white text-violet-600 shadow-sm"
              : "text-slate-400 hover:text-slate-600"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Historical
        </button>
      </div>

      <div className="mt-4 text-center text-xs font-bold text-slate-400 italic">
        {description}
      </div>
    </div>
  )
}