"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Web3Provider } from "./Web3Provider"
import { ModalProvider } from "./ModalProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until mounted on the client
  if (!mounted) {
    return null
  }

  return (
    <Web3Provider>
      <ModalProvider>{children}</ModalProvider>
    </Web3Provider>
  )
}
