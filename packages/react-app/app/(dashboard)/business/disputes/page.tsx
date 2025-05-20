"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { DisputeList } from '@/components/features/dispute/DisputeList';

export default function DisputesPage() {
  const { address } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!address) {
      router.push('/');
    }
  }, [address, router]);

  // Handle the case where we're on the server or loading
  if (typeof window === 'undefined' || !address) {
    return (
      <DashboardLayout type="business">
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-8">Dispute Management</h1>
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="business">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Dispute Management</h1>
        <DisputeList type="business" />
      </div>
    </DashboardLayout>
  );
}

