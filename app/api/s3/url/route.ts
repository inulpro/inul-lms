import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: "Missing object key" },
        { status: 400 }
      );
    }

    // Remove any leading slashes
    const cleanKey = key.startsWith("/") ? key.slice(1) : key;

    // Construct the public URL based on your S3 configuration
    const bucketName = env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
    const endpoint = env.AWS_ENDPOINT_URL_S3;

    let publicUrl: string;

    // For AWS S3
    if (endpoint.includes("amazonaws.com")) {
      publicUrl = `https://${bucketName}.s3.amazonaws.com/${cleanKey}`;
    } else {
      // For other S3-compatible services (like DigitalOcean Spaces, MinIO, etc.)
      publicUrl = `${endpoint}/${bucketName}/${cleanKey}`;
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Error generating S3 URL:", error);
    return NextResponse.json(
      { error: "Failed to generate S3 URL" },
      { status: 500 }
    );
  }
}
