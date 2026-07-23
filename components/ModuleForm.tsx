"use client";

import { useFormState } from "react-dom";
import { createModule, type FormState } from "@/app/actions/courses";
import SubmitButton from "@/components/SubmitButton";

const initial: FormState = {};

export default function ModuleForm({ courseId }: { courseId: string }) {
  const [state, formAction] = useFormState(createModule, initial);

  return (
    <form action={formAction} className="space-y-3 bg-white border border-line rounded-panel p-5">
      <input type="hidden" name="course_id" value={courseId} />
      <h4 className="font-medium text-sm">New weekly unit</h4>
      <div className="grid grid-cols-3 gap-3">
        <input name="title" placeholder="Module title" required className="col-span-2 border border-line rounded-panel px-3 py-2 text-sm" />
        <input name="week_number" type="number" placeholder="Week #" className="border border-line rounded-panel px-3 py-2 text-sm" />
      </div>
      <textarea
        name="learning_objectives"
        rows={2}
        placeholder="Learning objectives — one per line"
        className="w-full border border-line rounded-panel px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-rust text-xs">{state.error}</p>}
      <SubmitButton className="text-sm bg-goldsoft text-ink rounded-panel px-3 py-1.5 font-medium hover:opacity-80">
        Add module
      </SubmitButton>
    </form>
  );
}
