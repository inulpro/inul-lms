"use server";

import { request } from "@arcjet/next";

import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { adminArcjet } from "@/lib/arcjet";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { courseSchema, CourseSchemaType } from "@/lib/zodSchema";
import { handleArcjetDecision, logArcjetDecision } from "@/lib/arcjet-utils";

export async function CreateCourse(
  values: CourseSchemaType
): Promise<ApiResponse> {
  const session = await requireAdmin();

  try {
    const req = await request();
    const decision = await adminArcjet.protect(req, {
      fingerprint: session.user.id,
    });

    logArcjetDecision(decision, "Create Course");

    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) {
      return arcjetError;
    }

    const validation = courseSchema.safeParse(values);

    if (!validation.success) {
      return {
        status: "error",
        message: "Invalid course data",
      };
    }

    await prisma.course.create({
      data: {
        ...validation.data,
        userId: session.user.id,
      },
    });

    return { status: "success", message: "Course created successfully" };
  } catch {
    return { status: "error", message: "Failed to create course" };
  }
}
