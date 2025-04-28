'use client';

import { useState, useEffect } from 'react';
import { Providers as Web3Providers } from '@/providers';
import { Toaster } from '@/components/ui/toaster';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Web3Providers>
      {children}
      <Toaster />
    </Web3Providers>
  );
} 