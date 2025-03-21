import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import { Web3Provider } from '@/providers/Web3Provider';
import { ModalProvider } from '@/providers/ModalProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SubPay - Web3 Subscription Management',
  description: 'Manage your Web3 subscriptions with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background font-sans antialiased`}>
        <Web3Provider>
          <ModalProvider>
            {children}
          </ModalProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
