"use client"

export default function Header() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <div className="text-lg font-semibold tracking-tight text-zinc-50">
            RevAgent
          </div>
          <div className="text-sm text-zinc-500">Revenue Intelligence</div>
        </div>

        <div className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-sm text-zinc-400">
          Pipeline: ready
        </div>
      </div>
    </header>
  )
}