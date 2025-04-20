import { http, createConfig } from "wagmi"
import { celo, celoAlfajores } from "wagmi/chains"
import { getDefaultConfig } from "@rainbow-me/rainbowkit"

// Use the project ID from .env file
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "5ff120ed427ab9eac2fae16c8424d45a"

export const config = getDefaultConfig({
  appName: "SubPay",
  projectId,
  chains: [celo, celoAlfajores],
  transports: {
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
  },
  appDescription: "Subscription Payment Platform",
  appUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  appIcon: typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : 'http://localhost:3000/favicon.ico',
}) 