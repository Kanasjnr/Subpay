"use client"

import type React from "react"
import { useState, useEffect } from "react"
import "@rainbow-me/rainbowkit/styles.css"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RainbowKitProvider, darkTheme, getDefaultWallets } from "@rainbow-me/rainbowkit"
import { WagmiProvider, createConfig, http } from "wagmi"
import { celo } from "viem/chains"

// Debug environment variable
console.log('WalletConnect Project ID:', process.env.NEXT_PUBLIC_WC_PROJECT_ID)

// Create a client outside of the component to ensure it's not recreated on every render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false
    }
  }
})

// Get project ID from environment variable
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || ""

// Configure wallets
const { connectors } = getDefaultWallets({
  appName: 'SubPay',
  projectId
})

// Create wagmi config
const config = createConfig({
  chains: [celo],
  transports: {
    [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC_URL),
  },
  connectors
})

function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export { Providers as Web3Provider }
