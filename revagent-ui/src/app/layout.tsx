import type { Metadata } from "next"
import { Inter } from "next/font/google"

import "./globals.css"
import Providers from "./providers"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "RevAgent",
  description: "Revenue Intelligence",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} min-h-screen bg-slate-50 text-slate-900 antialiased relative`}
      >
        {/* Faded Graph/Grid Background */}
        <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
              <pattern id="graph-pattern" width="400" height="400" patternUnits="userSpaceOnUse">
                <path d="M 0 300 Q 100 250, 200 300 T 400 200" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M 0 350 Q 150 400, 250 300 T 400 100" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M 0 200 Q 50 150, 150 250 T 400 50" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            <rect width="100%" height="100%" fill="url(#graph-pattern)" />
          </svg>
        </div>
        
        <div className="relative z-10">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  )
}