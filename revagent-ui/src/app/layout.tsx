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
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} min-h-screen bg-zinc-950 text-zinc-50 antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}