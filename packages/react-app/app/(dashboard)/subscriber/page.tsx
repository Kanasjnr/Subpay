'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { PlanList } from '@/components/features/subscription/PlanList';
import { SubscriptionList } from '@/components/features/subscription/SubscriptionList';
import { OpenDisputeForm } from '@/components/features/subscription/OpenDisputeForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSubPay } from '@/hooks/useSubPay';
import { Coins, DollarSign, Euro } from 'lucide-react';
import { DisputeList } from '@/components/features/dispute/DisputeList';

export default function SubscriberDashboard() {
  const { address } = useAccount();
  const router = useRouter();
  const { cUSDBalance, cEURBalance, subscriberSubscriptions, getSubscriptionDetails } = useSubPay();
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<bigint | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [subscriptionStats, setSubscriptionStats] = useState({ active: 0, canceled: 0 });
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!address) {
      router.push('/');
    }
  }, [address, router]);

  const fetchSubscriptionStats = useCallback(async () => {
    if (!subscriberSubscriptions || !Array.isArray(subscriberSubscriptions) || hasInitialized) return;
    
    try {
      const details = await Promise.all(
        subscriberSubscriptions.map(async (id) => {
          const subscription = await getSubscriptionDetails(id);
          return subscription?.active;
        })
      );
      
      const stats = details.reduce(
        (acc, isActive) => ({
          active: acc.active + (isActive ? 1 : 0),
          canceled: acc.canceled + (isActive ? 0 : 1),
        }),
        { active: 0, canceled: 0 }
      );
      
      setSubscriptionStats(stats);
      setHasInitialized(true);
    } catch (error) {
      console.error("Error fetching subscription stats:", error);
    }
  }, [subscriberSubscriptions, getSubscriptionDetails, hasInitialized]);

  useEffect(() => {
    fetchSubscriptionStats();
  }, [fetchSubscriptionStats]);

  // Reset initialization when subscriptions change
  useEffect(() => {
    if (subscriberSubscriptions) {
      setHasInitialized(false);
    }
  }, [subscriberSubscriptions]);

  if (!address) return null;

  return (
    <DashboardLayout type="subscriber">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground mt-1">
              Here&apos;s an overview of your subscriptions
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Wallet:</span>
            <code className="bg-secondary px-2 py-1 rounded text-sm">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </code>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                cUSD Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {typeof cUSDBalance === 'object' &&
                cUSDBalance &&
                'formatted' in cUSDBalance
                  ? Number(cUSDBalance.formatted).toFixed(2)
                  : '0.00'}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Available for subscriptions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-blue-500" />
                cEUR Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {typeof cEURBalance === 'object' &&
                cEURBalance &&
                'formatted' in cEURBalance
                  ? Number(cEURBalance.formatted).toFixed(2)
                  : '0.00'}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Available for subscriptions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-500" />
                Subscriptions Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-green-500">
                    {subscriptionStats.active}
                  </div>
                  <p className="text-sm text-muted-foreground">Active subscriptions</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-500">
                    {subscriptionStats.canceled}
                  </div>
                  <p className="text-sm text-muted-foreground">Canceled subscriptions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="bg-card border border-border">
                <TabsTrigger value="active">Active Subscriptions</TabsTrigger>
                <TabsTrigger value="available">Available Plans</TabsTrigger>
                <TabsTrigger value="disputes">Disputes</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-4">
                <SubscriptionList
                  type="subscriber"
                  onOpenDispute={(subscriptionId) => {
                    setSelectedSubscriptionId(subscriptionId);
                    setShowDisputeModal(true);
                  }}
                />
              </TabsContent>

              <TabsContent value="available" className="mt-4">
                <PlanList type="subscriber" />
              </TabsContent>

              <TabsContent value="disputes" className="mt-4">
                <DisputeList type="subscriber" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Dialog open={showDisputeModal} onOpenChange={setShowDisputeModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Open a Dispute</DialogTitle>
            </DialogHeader>
            {selectedSubscriptionId && (
              <OpenDisputeForm
                subscriptionId={selectedSubscriptionId}
                onSuccess={() => {
                  setShowDisputeModal(false);
                  setSelectedSubscriptionId(null);
                }}
                onCancel={() => {
                  setShowDisputeModal(false);
                  setSelectedSubscriptionId(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
