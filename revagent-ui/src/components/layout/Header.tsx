"use client"

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-white">
              Rev<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Agent</span>
            </div>
            <div className="text-xs font-medium text-zinc-400">Revenue Intelligence AI</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            Pipeline Active
          </div>
          <div className="h-8 w-8 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-300">
            SM
          </div>
        </div>
      </div>
    </header>
  )
}