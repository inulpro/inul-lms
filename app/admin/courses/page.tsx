import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/app/data/admin/require-admin";

export default async function CoursesPage() {
  await requireAdmin();

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Courses</h1>
        <Link className={buttonVariants()} href="/admin/courses/create">
          Create Course
        </Link>
      </div>

      <div>
        <h1>Here you will see all of the courses</h1>
      </div>
    </>
  );
}
