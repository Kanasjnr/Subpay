"use client"

import type React from "react"
import { Toaster } from "@/components/ui/toaster"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Use dynamic import with no SSR for the Providers component
const DynamicProviders = dynamic(() => import("@/providers").then((mod) => mod.Providers), {
  ssr: false,
})

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Return a loading state during SSR and initial client-side render
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Only render the actual content after mounting on the client
  return (
    <>
      <DynamicProviders>{children}</DynamicProviders>
      <Toaster />
    </>
  )
}
