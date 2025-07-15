import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import { requireAdmin } from "@/app/data/admin/require-admin";

import { env } from "@/lib/env";
import { S3 } from "@/lib/S3Client";
import { uploadArcjet } from "@/lib/arcjet";
import {
  handleArcjetDecision,
  protectWithErrorHandling,
} from "@/lib/arcjet-utils";

export async function DELETE(request: Request) {
  const session = await requireAdmin();

  try {
    const { decision, error } = await protectWithErrorHandling(
      uploadArcjet,
      request,
      { fingerprint: session.user.id },
      "S3 Delete"
    );

    // Jika ada error timeout/network, lanjutkan request (fail-open)
    if (error) {
      console.warn(`[S3 Delete] Arcjet ${error} - proceeding with delete`);
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
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: "Missing or invalid object key" },
        { status: 400 }
      );
    }

    const command = new DeleteObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      Key: key,
    });

    await S3.send(command);

    return NextResponse.json(
      { message: "File deleted successfully" },
      {
        status: 200,
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
