"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DisputeStatus, Resolution } from './DisputeList';
import { formatEther } from 'viem';
import { Textarea } from '@/components/ui/textarea';
import { useSubPay } from '@/hooks/useSubPay';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, FileText, Upload, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

interface EvidenceData {
  text: string;
  images: string[];
}

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
  type: "business" | "subscriber";
  isArbitrator: boolean;
}

export const DisputeCard: React.FC<DisputeCardProps> = ({ dispute, onResolve, type, isArbitrator }) => {
  const [showEvidence, setShowEvidence] = useState(false);
  const [evidence, setEvidence] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriberEvidence, setSubscriberEvidence] = useState<EvidenceData | null>(null);
  const { submitEvidence, getEvidence } = useSubPay();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSubscriberEvidence = async () => {
      if (dispute.status >= DisputeStatus.EvidenceSubmitted) {
        try {
          const evidenceData = await getEvidence(BigInt(dispute.disputeId));
          if (evidenceData) {
            try {
              // Try to parse as JSON first
              const parsedEvidence = JSON.parse(evidenceData);
              setSubscriberEvidence(parsedEvidence);
            } catch (e) {
              // If not valid JSON, treat as plain text
              setSubscriberEvidence({
                text: evidenceData,
                images: []
              });
            }
          }
        } catch (error) {
          console.error('Error fetching subscriber evidence:', error);
        }
      }
    };

    fetchSubscriberEvidence();
  }, [dispute.disputeId, dispute.status, getEvidence]);

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

  const getStatusText = (status: DisputeStatus) => {
    switch (status) {
      case DisputeStatus.Opened:
        return "Opened";
      case DisputeStatus.EvidenceSubmitted:
        return "Evidence Submitted";
      case DisputeStatus.Resolved:
        return "Resolved";
      case DisputeStatus.Cancelled:
        return "Cancelled";
      default:
        return "Unknown";
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

  const formatAmount = (amount: bigint) => {
    try {
      return formatEther(amount);
    } catch (error) {
      console.error('Error formatting amount:', error);
      return '0';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Filter for image files only
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      setSelectedFiles(prev => [...prev, ...imageFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitEvidence = async () => {
    if (!evidence.trim() && selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please provide text evidence or upload images before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert files to base64 strings
      const filePromises = selectedFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      const fileData = await Promise.all(filePromises);
      
      // Combine text and image evidence
      const combinedEvidence = {
        text: evidence,
        images: fileData
      };

      await submitEvidence(BigInt(dispute.id), JSON.stringify(combinedEvidence));
      toast({
        title: "Success",
        description: "Evidence submitted successfully",
      });
      setEvidence('');
      setSelectedFiles([]);
      setShowEvidence(false);
    } catch (error) {
      console.error('Error submitting evidence:', error);
      toast({
        title: "Error",
        description: "Failed to submit evidence. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Dispute #{dispute.disputeId}</CardTitle>
          <Badge className={getStatusColor(dispute.status)}>
            {getStatusText(dispute.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Plan:</strong> {dispute.planName}</p>
          <p><strong>Amount:</strong> {formatAmount(dispute.amount)} cUSD</p>
          <p><strong>Reason:</strong> {dispute.reason}</p>
          {dispute.status === DisputeStatus.Resolved && (
            <>
              <p><strong>Resolution:</strong> {getResolutionText(dispute.resolution)}</p>
              {dispute.refundAmount > 0n && (
                <p><strong>Refund Amount:</strong> {formatAmount(dispute.refundAmount)} cUSD</p>
              )}
            </>
          )}
        </div>

        {type === "business" && (
          <div className="mt-4 space-y-4">
            {dispute.status === DisputeStatus.Resolved && (
              <Button
                variant="outline"
                onClick={() => setShowEvidence(!showEvidence)}
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                {showEvidence ? "Hide Evidence" : "View Evidence"}
              </Button>
            )}

            {showEvidence && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Subscriber&apos;s Evidence</h4>
                  {subscriberEvidence ? (
                    <div className="space-y-4">
                      {subscriberEvidence.text && (
                        <div className="p-4 bg-muted rounded-md">
                          <h5 className="font-medium mb-2">Text Evidence:</h5>
                          <p className="whitespace-pre-wrap">{subscriberEvidence.text}</p>
                        </div>
                      )}
                      
                      {subscriberEvidence.images && subscriberEvidence.images.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="font-medium">Image Evidence:</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {subscriberEvidence.images.map((image, index) => (
                              <div key={index} className="relative aspect-square">
                                <Image
                                  src={image}
                                  alt={`Evidence Image ${index + 1}`}
                                  fill
                                  className="object-cover rounded-md"
                                  sizes="(max-width: 768px) 50vw, 33vw"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Evidence Submitted</AlertTitle>
                      <AlertDescription>
                        The subscriber has not submitted any evidence yet.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {dispute.status === DisputeStatus.EvidenceSubmitted && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="evidence-images">Upload Images</Label>
                      <Input
                        id="evidence-images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="cursor-pointer"
                      />
                      <p className="text-sm text-muted-foreground">
                        Upload images to support your evidence (PNG, JPG, JPEG)
                      </p>
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-medium">Selected Images:</h5>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="relative aspect-square group">
                              <Image
                                src={URL.createObjectURL(file)}
                                alt={`Evidence ${index + 1}`}
                                fill
                                className="object-cover rounded-md"
                                sizes="(max-width: 768px) 50vw, 33vw"
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeFile(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleSubmitEvidence}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Submitting..." : "Submit Evidence"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {dispute.status !== DisputeStatus.Resolved && 
         dispute.status !== DisputeStatus.Cancelled && 
         isArbitrator && (
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