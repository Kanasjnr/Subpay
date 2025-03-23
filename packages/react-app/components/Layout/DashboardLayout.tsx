'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BottomNav } from './BottomNav';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';

interface DashboardLayoutProps {
  children: ReactNode;
  type: 'business' | 'subscriber';
}

export default function DashboardLayout({ children, type }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border h-16">
        <div className="flex items-center h-full px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Logo size={32} animated={false} />
            <span className="font-bold text-xl">SubPay</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-20">
        <div className="px-4">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav type={type} pathname={pathname} />
    </div>
  );
} 