"use client"

import type React from "react"
import { Web3Provider } from "./Web3Provider"
import { ModalProvider } from "./ModalProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <ModalProvider>{children}</ModalProvider>
    </Web3Provider>
  )
}
