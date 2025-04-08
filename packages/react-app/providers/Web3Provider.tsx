"use client"

import type React from "react"
import { useState, useEffect } from "react"
import "@rainbow-me/rainbowkit/styles.css"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit"
import { WagmiProvider, http } from "wagmi"
import { celo, celoAlfajores } from "wagmi/chains"

// Create QueryClient outside component to ensure it's only created once
const queryClient = new QueryClient()

// Create the configuration outside the component
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "044601f65212332475a09bc14ceb3c34"

// Create the configuration outside the component
const config = getDefaultConfig({
  appName: "Subpay",
  projectId,
  chains: [celo, celoAlfajores],
  transports: {
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
  },
})

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until mounted on the client
  if (!mounted) {
    return null
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#35D07F",
            accentColorForeground: "white",
            borderRadius: "small",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
