"use client";

import { useFormState } from "react-dom";
import { createCourse, type FormState } from "@/app/actions/courses";

const initial: FormState = {};

export default function CourseForm() {
  const [state, formAction] = useFormState(createCourse, initial);

  return (
    <form action={formAction} className="space-y-4 bg-white border border-line rounded-panel p-6">
      <h3 className="font-semibold">New course</h3>
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input name="title" required className="w-full border border-line rounded-panel px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea name="description" rows={2} className="w-full border border-line rounded-panel px-3 py-2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Semester</label>
          <input name="semester" placeholder="Fall 2026" className="w-full border border-line rounded-panel px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Credit hours</label>
          <input name="credit_hours" type="number" className="w-full border border-line rounded-panel px-3 py-2" />
        </div>
      </div>
      {state?.error && <p className="text-rust text-sm">{state.error}</p>}
      <button type="submit" className="bg-gold text-white rounded-panel px-4 py-2 font-medium hover:opacity-90">
        Create course
      </button>
    </form>
  );
}
