"use server";

import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { adminArcjet } from "@/lib/arcjet";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { handleArcjetDecision, logArcjetDecision } from "@/lib/arcjet-utils";

export async function DeleteCourse(courseId: string): Promise<ApiResponse> {
  const session = await requireAdmin();

  try {
    const req = await request();
    const decision = await adminArcjet.protect(req, {
      fingerprint: session.user.id,
    });

    logArcjetDecision(decision, "Delete Course");

    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) {
      return arcjetError;
    }

    await prisma.course.delete({
      where: {
        id: courseId,
      },
    });

    revalidatePath("/admin/courses");

    return { status: "success", message: "Course deleted successfully" };
  } catch {
    return {
      status: "error",
      message: "Failed to delete course",
    };
  }
}
