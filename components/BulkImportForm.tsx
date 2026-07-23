"use client";

import { useFormState } from "react-dom";
import { bulkImportOutline, type FormState } from "@/app/actions/courses";
import SubmitButton from "@/components/SubmitButton";

const initial: FormState = {};

const EXAMPLE = `## Week 1: Intro to Testing Basics
Objectives: Understand testing types | Learn TDD basics

### Lesson: What is Testing?
Video: https://youtube.com/watch?v=xyz
Testing is the process of evaluating software to find defects.

### Lesson: Unit vs Integration
Unit tests check individual functions in isolation.

## Week 2: Advanced Patterns
Objectives: Mock objects | Test doubles

### Lesson: Mocking Basics
Mocks let you replace real dependencies during a test.`;

export default function BulkImportForm({ courseId }: { courseId: string }) {
  const [state, formAction] = useFormState(bulkImportOutline, initial);

  return (
    <details className="bg-white border border-line rounded-panel p-5">
      <summary className="font-medium cursor-pointer">
        Bulk import a whole week (faster than one form at a time)
      </summary>

      <form action={formAction} className="space-y-3 mt-4">
        <input type="hidden" name="course_id" value={courseId} />
        <textarea
          name="outline"
          rows={10}
          placeholder={EXAMPLE}
          className="w-full border border-line rounded-panel px-3 py-2 text-sm font-mono"
        />
        <p className="text-xs text-ink/50">
          Format: <code className="font-mono">## Week N: Title</code> starts a module,{" "}
          <code className="font-mono">Objectives: a | b</code> sets objectives,{" "}
          <code className="font-mono">### Lesson: Title</code> starts a lesson, optional{" "}
          <code className="font-mono">Video: url</code>, then plain paragraphs as content.
        </p>
        {state?.error && <p className="text-rust text-xs">{state.error}</p>}
        <SubmitButton className="text-sm bg-gold text-white rounded-panel px-4 py-2 font-medium hover:opacity-90">
          Import
        </SubmitButton>
      </form>
    </details>
  );
}
