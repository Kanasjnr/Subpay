"use client"

import type React from "react"

import { Providers } from "@/providers"
import { useEffect, useState } from "react"

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Return a placeholder or nothing during SSR
  if (!mounted) {
    // Return a minimal version that matches the structure but doesn't use any client hooks
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Once mounted on the client, render the full providers
  return <Providers>{children}</Providers>
}
