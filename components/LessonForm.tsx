"use client";

import { useFormState } from "react-dom";
import { createLesson, type FormState } from "@/app/actions/courses";
import RichTextEditor from "@/components/RichTextEditor";
import SubmitButton from "@/components/SubmitButton";

const initial: FormState = {};

export default function LessonForm({
  moduleId,
  courseId,
}: {
  moduleId: string;
  courseId: string;
}) {
  const [state, formAction] = useFormState(createLesson, initial);

  return (
    <form action={formAction} className="space-y-3 bg-paper border border-line rounded-panel p-4 mt-3">
      <input type="hidden" name="module_id" value={moduleId} />
      <input type="hidden" name="course_id" value={courseId} />
      <input name="title" placeholder="Lesson title" required className="w-full border border-line rounded-panel px-3 py-2 text-sm bg-white" />
      <input name="video_url" placeholder="YouTube/Vimeo URL (optional)" className="w-full border border-line rounded-panel px-3 py-2 text-sm bg-white" />
      <RichTextEditor name="content_richtext" />
      <div>
        <label className="block text-xs text-ink/50 mb-1">PDF attachment (optional)</label>
        <input name="pdf_file" type="file" accept=".pdf" className="w-full text-sm" />
      </div>
      {state?.error && <p className="text-rust text-xs">{state.error}</p>}
      <SubmitButton className="text-sm bg-gold text-white rounded-panel px-3 py-1.5 font-medium hover:opacity-90">
        Add lesson
      </SubmitButton>
    </form>
  );
}
