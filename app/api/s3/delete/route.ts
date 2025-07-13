import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import { env } from "@/lib/env";
import { S3 } from "@/lib/S3Client";
import { uploadArcjet } from "@/lib/arcjet";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { handleArcjetDecision, logArcjetDecision } from "@/lib/arcjet-utils";

export async function DELETE(request: Request) {
  const session = await requireAdmin();

  try {
    const decision = await uploadArcjet.protect(request, {
      fingerprint: session.user.id,
    });

    logArcjetDecision(decision, "S3 Delete");

    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) {
      return NextResponse.json({ error: arcjetError.message }, { status: 429 });
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
