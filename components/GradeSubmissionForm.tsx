"use client";

import { useFormState } from "react-dom";
import { gradeSubmission, type GradeFormState } from "@/app/actions/grading";
import SubmitButton from "@/components/SubmitButton";

const initial: GradeFormState = {};

export default function GradeSubmissionForm({
  submissionId,
  currentScore,
}: {
  submissionId: string;
  currentScore: number | null;
}) {
  const boundAction = gradeSubmission.bind(null, submissionId);
  const [state, formAction] = useFormState(boundAction, initial);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input
        name="score"
        type="number"
        min={0}
        max={100}
        defaultValue={currentScore ?? ""}
        placeholder="Score"
        className="w-24 border border-line rounded-panel px-2 py-1 text-sm"
      />
      <SubmitButton className="text-xs bg-gold text-white rounded-panel px-3 py-1.5 font-medium hover:opacity-90">
        Save Grade
      </SubmitButton>
      {state?.error && <p className="text-rust text-xs">{state.error}</p>}
    </form>
  );
}
