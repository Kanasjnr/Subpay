import type { Metadata } from "next"
import "@/styles/globals.css";
import { Inter } from "next/font/google";
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from '../providers'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SubPay",
  description: "Subscription Payment Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="SubPay" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SubPay" />
        <meta name="description" content="Manage your DeFi-based subscription payments on the Celo blockchain" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#35D07F" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <ErrorBoundary>
              {children}
              <Toaster />
              <ToastContainer
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
            </ErrorBoundary>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
