import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { tryCatch } from "@/hooks/try-catch";

import { DeletedLesson } from "../actions";

export function DeleteLesson({
  lessonId,
  chapterId,
  courseId,
}: {
  lessonId: string;
  chapterId: string;
  courseId: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onSubmit() {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        DeletedLesson({ lessonId, chapterId, courseId })
      );

      if (error) {
        toast.error("An unexpected error occurred, please try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        setOpen(false);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2Icon className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this
            lesson.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button disabled={pending} onClick={onSubmit}>
            {pending ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
