import "server-only";

import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

export async function adminGetLesson(id: string) {
  await requireAdmin();

  const data = await prisma.lesson.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      title: true,
      videoKey: true,
      thumbnailKey: true,
      description: true,
      position: true,
    },
  });

  if (!data) {
    return notFound();
  }

  return data;
}

export type AdminLessonType = Awaited<ReturnType<typeof adminGetLesson>>;
