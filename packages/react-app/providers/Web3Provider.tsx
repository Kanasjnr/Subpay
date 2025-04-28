"use client"

import "@rainbow-me/rainbowkit/styles.css"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit"
import { WagmiProvider } from "wagmi"
import { celo, celoAlfajores } from "wagmi/chains"
import { http } from "viem"

// Get project ID from environment variables
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "044601f65212332475a09bc14ceb3c34"

// Create config outside of component to ensure it's only created once
const config = getDefaultConfig({
  appName: "Subpay",
  projectId,
  chains: [celo, celoAlfajores],
  ssr: true
})

// Create QueryClient outside of component to ensure it's only created once
const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
