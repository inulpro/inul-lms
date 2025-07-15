import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { requireAdmin } from "@/app/data/admin/require-admin";

import { env } from "@/lib/env";
import { S3 } from "@/lib/S3Client";
import { uploadArcjet } from "@/lib/arcjet";
import { fileUploadSchema } from "@/lib/zodSchema";
import {
  handleArcjetDecision,
  protectWithErrorHandling,
} from "@/lib/arcjet-utils";

export async function POST(request: Request) {
  const session = await requireAdmin();

  try {
    const { decision, error } = await protectWithErrorHandling(
      uploadArcjet,
      request,
      { fingerprint: session.user.id },
      "S3 Upload"
    );

    // Jika ada error timeout/network, lanjutkan request (fail-open)
    if (error) {
      console.warn(`[S3 Upload] Arcjet ${error} - proceeding with upload`);
    } else if (decision) {
      const arcjetError = handleArcjetDecision(decision);
      if (arcjetError) {
        return NextResponse.json(
          { error: arcjetError.message },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    const validation = fileUploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { fileName, contentType, size } = validation.data;
    const uniqueKey = `${uuidv4()}}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      ContentType: contentType,
      ContentLength: size,
      Key: uniqueKey,
    });

    const presignedUrl = await getSignedUrl(S3, command, {
      expiresIn: 360, // URL expires in 6 minutes
    });

    const response = {
      presignedUrl,
      key: uniqueKey,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
