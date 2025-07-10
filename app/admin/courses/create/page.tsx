import { requireAdmin } from "@/app/data/admin/require-admin";

import CourseCreationForm from "./course-creation-form";

export default async function CourseCreationPage() {
  await requireAdmin();

  return <CourseCreationForm />;
}
