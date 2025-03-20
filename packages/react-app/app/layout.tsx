import "@/styles/globals.css"
import { Web3Provider } from "@/providers/Web3Provider"

export const metadata = {
  title: 'SubPay - Web3 Payment Solution',
  description: 'A decentralized payment solution built on Celo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  )
}
