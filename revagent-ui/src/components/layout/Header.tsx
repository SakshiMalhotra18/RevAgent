"use client"

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-600/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <div>
            <div className="text-xl font-black tracking-tight text-slate-900">
              Rev<span className="text-violet-600">Agent</span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Revenue Intelligence AI</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-600 uppercase tracking-wide">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            System Active
          </div>
          <div className="h-9 w-9 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-sm font-bold text-slate-600 shadow-sm">
            SM
          </div>
        </div>
      </div>
    </header>
  )
}