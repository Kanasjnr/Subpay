import "@/styles/globals.css"

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
        {children}
      </body>
    </html>
  )
}
