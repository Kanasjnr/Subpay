"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useSubPay } from "@/hooks/useSubPay"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, X } from "lucide-react"
import Image from "next/image"

interface SubmitEvidenceFormProps {
  disputeId: bigint
  onSuccess?: () => void
  onCancel?: () => void
}

type UploadedImage = {
  url: string
  publicId: string
}

export function SubmitEvidenceForm({ disputeId, onSuccess, onCancel }: SubmitEvidenceFormProps) {
  const { submitEvidence, isSubmittingEvidence, getDispute } = useSubPay()
  const { toast } = useToast()
  const [textEvidence, setTextEvidence] = useState("")
  const [loading, setLoading] = useState(false)
  const [dispute, setDispute] = useState<any>(null)
  const dataFetchedRef = useRef(false)
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch dispute details when the component mounts
  useEffect(() => {
    const fetchDispute = async () => {
      // Prevent multiple fetches
      if (dataFetchedRef.current) return

      console.log("SubmitEvidenceForm: Fetching dispute details for ID:", disputeId.toString())
      try {
        setLoading(true)
        const disputeData = await getDispute(disputeId)
        console.log("SubmitEvidenceForm: Dispute data received:", disputeData)
        setDispute(disputeData)
        dataFetchedRef.current = true
      } catch (error) {
        console.error("SubmitEvidenceForm: Error fetching dispute:", error)
        toast({
          title: "Error",
          description: "Failed to fetch dispute details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDispute()
  }, [disputeId, getDispute, toast])

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Create a FormData object to send the file
        const formData = new FormData()
        formData.append("file", file)
        formData.append("disputeId", disputeId.toString())

        // Upload to our API endpoint that handles Cloudinary uploads
        const response = await fetch("/api/upload-evidence", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("Upload error:", errorData)
          throw new Error(errorData.error || "Failed to upload image")
        }

        const data = await response.json()
        return {
          url: data.url,
          publicId: data.public_id,
        }
      })

      const uploadedImages = await Promise.all(uploadPromises)
      setImages((prev) => [...prev, ...uploadedImages])

      toast({
        title: "Success",
        description: `${files.length} image${files.length > 1 ? "s" : ""} uploaded successfully`,
      })
    } catch (error) {
      console.error("Error uploading images:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload images",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeImage = (publicId: string) => {
    setImages(images.filter((img) => img.publicId !== publicId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("SubmitEvidenceForm: Form submitted with evidence:", { text: textEvidence, images })

    if (!textEvidence && images.length === 0) {
      console.log("SubmitEvidenceForm: Missing evidence")
      toast({
        title: "Error",
        description: "Please provide text or image evidence for your dispute",
        variant: "destructive",
      })
      return
    }

    try {
      // Combine text evidence and image URLs into a single JSON string
      const evidenceData = {
        text: textEvidence,
        images: images.map((img) => img.url),
      }

      const evidenceString = JSON.stringify(evidenceData)
      console.log("SubmitEvidenceForm: Submitting evidence for dispute ID:", disputeId.toString())

      const result = await submitEvidence(disputeId, evidenceString)
      console.log("SubmitEvidenceForm: Evidence submission result:", result)

      if (result) {
        toast({
          title: "Success",
          description: "Evidence submitted successfully",
        })

        onSuccess?.()
      }
    } catch (error) {
      console.error("SubmitEvidenceForm: Error submitting evidence:", error)
      toast({
        title: "Error",
        description: "Failed to submit evidence",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading dispute details...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!dispute) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Dispute not found or could not be loaded.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Evidence</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div>
            <span className="font-semibold">Dispute ID:</span> {disputeId.toString()}
          </div>
          {dispute.reason && (
            <div>
              <span className="font-semibold">Reason:</span> {dispute.reason}
            </div>
          )}
          {dispute.status !== undefined && (
            <div>
              <span className="font-semibold">Status:</span>{" "}
              {dispute.status === 1
                ? "Open"
                : dispute.status === 2
                  ? "Evidence Submitted"
                  : dispute.status === 3
                    ? "Resolved"
                    : dispute.status === 4
                      ? "Cancelled"
                      : "Unknown"}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="textEvidence">Your Evidence</Label>
            <Textarea
              id="textEvidence"
              value={textEvidence}
              onChange={(e) => setTextEvidence(e.target.value)}
              placeholder="Provide text evidence to support your case..."
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Provide clear and concise evidence to support your position in this dispute.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Upload Evidence Images</Label>
            <div
              className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={handleUploadClick}
            >
              <div className="space-y-2 text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-primary">Click to upload</span> or drag and drop
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
          </div>

          {/* Preview uploaded images */}
          {images.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Images ({images.length})</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image) => (
                  <div key={image.publicId} className="relative aspect-square group">
                    <Image
                      src={image.url || "/placeholder.svg"}
                      alt="Evidence"
                      fill
                      className="object-cover rounded-md"
                      sizes="(max-width: 768px) 50vw, 33vw"
                      priority={false}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image.publicId)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
              <span>Uploading images...</span>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmittingEvidence || uploading || (!textEvidence && images.length === 0)}
            >
              {isSubmittingEvidence ? "Submitting..." : "Submit Evidence"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

