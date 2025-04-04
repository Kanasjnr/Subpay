import { type NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    // Get the form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const disputeId = (formData.get("disputeId") as string) || "general"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Convert the file to a buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create a base64 string from the buffer
    const base64String = `data:${file.type};base64,${buffer.toString("base64")}`

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64String, {
      folder: `disputes/${disputeId}`,
      resource_type: "auto",
    })

    // Return the Cloudinary response
    return NextResponse.json({
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    })
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}

