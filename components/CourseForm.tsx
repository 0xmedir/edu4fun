"use client";

import { useFormState } from "react-dom";
import { createCourse, type FormState } from "@/app/actions/courses";
import SubmitButton from "@/components/SubmitButton";

const initial: FormState = {};

type Department = { id: string; name: string };

export default function CourseForm({ departments }: { departments: Department[] }) {
  const [state, formAction] = useFormState(createCourse, initial);

  return (
    <form action={formAction} className="space-y-4 bg-white border border-line rounded-panel p-6">
      <h3 className="font-semibold">New course</h3>
      <div>
        <label className="block text-sm font-medium mb-1">Department</label>
        <select name="department_id" className="w-full border border-line rounded-panel px-3 py-2">
          <option value="">— None —</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
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
      <SubmitButton className="bg-gold text-white rounded-panel px-4 py-2 font-medium hover:opacity-90">
        Create course
      </SubmitButton>
    </form>
  );
}
