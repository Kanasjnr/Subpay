"use client"

import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { DisputeStatus, Resolution } from './DisputeList';
import { formatEther } from 'viem';

interface DisputeCardProps {
  dispute: {
    id: number;
    disputeId: number;
    status: DisputeStatus;
    planName: string;
    amount: bigint;
    reason: string;
    resolution: Resolution;
    refundAmount: bigint;
    uniqueKey: string;
  };
  onResolve: (dispute: DisputeCardProps['dispute']) => void;
}

export const DisputeCard: React.FC<DisputeCardProps> = ({ dispute, onResolve }) => {
  const getStatusColor = (status: DisputeStatus) => {
    switch (status) {
      case DisputeStatus.Opened:
        return "bg-yellow-500";
      case DisputeStatus.EvidenceSubmitted:
        return "bg-blue-500";
      case DisputeStatus.Resolved:
        return "bg-green-500";
      case DisputeStatus.Cancelled:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getResolutionText = (resolution: Resolution) => {
    switch (resolution) {
      case Resolution.MerchantWins:
        return "Merchant Wins";
      case Resolution.SubscriberWins:
        return "Subscriber Wins";
      case Resolution.Compromise:
        return "Compromise";
      default:
        return "Pending";
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Dispute #{dispute.disputeId}</CardTitle>
          <Badge variant={dispute.status === DisputeStatus.Resolved ? "success" : "secondary"}>
            {DisputeStatus[dispute.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Plan:</strong> {dispute.planName}</p>
          <p><strong>Amount:</strong> {formatEther(dispute.amount)} ETH</p>
          <p><strong>Reason:</strong> {dispute.reason}</p>
          {dispute.status === DisputeStatus.Resolved && (
            <>
              <p><strong>Resolution:</strong> {getResolutionText(dispute.resolution)}</p>
              {dispute.refundAmount > 0n && (
                <p><strong>Refund Amount:</strong> {formatEther(dispute.refundAmount)} ETH</p>
              )}
            </>
          )}
        </div>
        {dispute.status !== DisputeStatus.Resolved && dispute.status !== DisputeStatus.Cancelled && (
          <Button
            onClick={() => onResolve(dispute)}
            className="mt-4"
          >
            Resolve Dispute
          </Button>
        )}
      </CardContent>
    </Card>
  );
}; 