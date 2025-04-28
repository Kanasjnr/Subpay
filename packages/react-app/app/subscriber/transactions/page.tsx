'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Search, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useSubPay } from '@/hooks/useSubPay';
import { formatEther } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { Empty } from '@/components/ui/empty';

// Helper function to safely format ether values
const safeFormatEther = (value: bigint | undefined) => {
  if (value === undefined) {
    return '0';
  }
  try {
    return formatEther(value);
  } catch (error) {
    console.error('Error formatting ether value:', error);
    return '0';
  }
};

// Helper function to format transaction hash
const formatTxHash = (hash: string) => {
  if (!hash || hash === 'Unknown') return 'Unknown';
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

export default function TransactionsPage() {
  const { address } = useAccount();
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const { getPaymentHistory, getPlanDetails } = useSubPay();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Helper function to safely convert BigInt to string for JSON
  const convertBigIntToString = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }
    if (typeof obj === 'bigint') {
      return obj.toString();
    }
    if (Array.isArray(obj)) {
      return obj.map(convertBigIntToString);
    }
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) {
        converted[key] = convertBigIntToString(obj[key]);
      }
      return converted;
    }
    return obj;
  };

  const fetchTransactions = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    try {
      console.log('Fetching transactions for address:', address);
      const processedHistory = await getPaymentHistory(address, 50);

      if (processedHistory.length > 0) {
        // If we have real payment history, use it
        console.log('Raw payment history before formatting:', processedHistory);
        
        // Create an array to store all formatted transactions
        const formattedTransactions = [];
        
        for (const [index, payment] of processedHistory.entries()) {
          console.log(`Processing payment ${index}:`, payment);
          console.log(`Payment metadata (transaction hash):`, payment.metadata);
          console.log(`Payment timestamp:`, payment.timestamp);
          console.log(`Payment subscription ID:`, payment.subscriptionId);

          // Convert timestamp to Date object (timestamp is in seconds)
          const date = new Date(Number(payment.timestamp) * 1000);
          console.log(`Formatted date:`, date.toLocaleString());

          let planName = 'Subscription Payment';
          if (payment.subscriptionId) {
            try {
              const planDetails = await getPlanDetails(BigInt(payment.subscriptionId));
              console.log('Plan details:', planDetails);
              if (planDetails && planDetails.metadata) {
                planName = planDetails.metadata;
              }
            } catch (error) {
              console.error('Error fetching plan details:', error);
            }
          }

          formattedTransactions.push({
            id: index,
            date: date.toLocaleString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }),
            planName,
            merchant: payment.merchant || payment.token || 'Unknown',
            amount: payment.amount
              ? safeFormatEther(payment.amount) + ' cUSD'
              : '0 cUSD',
            status: payment.success ? 'Success' : 'Failed',
            txHash: formatTxHash(payment.metadata),
            fullTxHash: payment.metadata || 'Unknown'
          });
        }

        console.log('Formatted transactions:', formattedTransactions);
        setTransactions(formattedTransactions);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch transactions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [address, getPaymentHistory, getPlanDetails, toast]);

  // Use a separate effect for the initial fetch and refresh
  useEffect(() => {
    if (address) {
      fetchTransactions();
    }
  }, [address, refreshKey]);

  // Memoize filtered transactions to prevent recalculation on every render
  const filteredTransactions = useMemo(() => {
    return transactions.filter(
      (tx) =>
        (tx.planName?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (tx.merchant?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (tx.txHash?.toLowerCase() || '').includes(search.toLowerCase())
    );
  }, [transactions, search]);

  // Memoize total spent calculation
  const totalSpent = useMemo(() => {
    return transactions
      .filter((tx) => tx.status === 'Success')
      .reduce((sum, tx) => {
        const amountStr = tx.amount?.split(' ')[0] || '0';
        const amount = Number.parseFloat(amountStr);
        return isNaN(amount) ? sum : sum + amount;
      }, 0);
  }, [transactions]);

  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  if (!address) {
    return (
      <DashboardLayout type="subscriber">
        <Empty
          title="Connect Wallet"
          message="Please connect your wallet to view transactions"
        />
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout type="subscriber">
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              Loading your transactions...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="subscriber">
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground mt-1">
              View your subscription payment history
            </p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-md">
            <span className="text-sm font-medium">
              Total Spent: {totalSpent.toFixed(2)} cUSD
            </span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="space-y-6">
                <Empty
                  title="No Transactions Found"
                  message="No subscription payment history was found for your account."
                />

                {/* Debug information section */}
                {debugInfo && (
                  <div className="mt-8 p-4 border border-amber-200 bg-amber-50 rounded-md">
                    <h3 className="text-sm font-medium text-amber-800 mb-2">
                      Debug Information
                    </h3>
                    <pre className="text-xs overflow-auto p-2 bg-white rounded border border-amber-100 max-h-40">
                      {debugInfo}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="grid grid-cols-6 gap-4 p-4 bg-muted/50 text-sm font-medium">
                  <div className="col-span-1">Date & Time</div>
                  <div>Plan</div>
                  <div>Merchant</div>
                  <div>Amount</div>
                  <div>Status</div>
                  <div>Transaction</div>
                </div>
                <div className="divide-y divide-border">
                  {filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="grid grid-cols-6 gap-4 p-4 items-center text-sm"
                    >
                      <div>{tx.date}</div>
                      <div>{tx.planName}</div>
                      <div className="font-mono truncate" title={tx.merchant}>
                        {tx.merchant.substring(0, 6)}...
                        {tx.merchant.substring(tx.merchant.length - 4)}
                      </div>
                      <div>{tx.amount}</div>
                      <div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            tx.status === 'Success'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                      <div className="font-mono truncate">
                        <a
                          href={`https://celo-alfajores.blockscout.com/tx/${tx.fullTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                          title={tx.fullTxHash}
                        >
                          {tx.txHash}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}