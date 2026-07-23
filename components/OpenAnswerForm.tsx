"use client";

import { useFormState } from "react-dom";
import { submitOpenAnswer, type OpenAnswerState } from "@/app/actions/openanswer";
import SubmitButton from "@/components/SubmitButton";

const initial: OpenAnswerState = {};

export default function OpenAnswerForm({
  questionId,
  path,
}: {
  questionId: string;
  path: string;
}) {
  const boundAction = submitOpenAnswer.bind(null, questionId, path);
  const [state, formAction] = useFormState(boundAction, initial);

  if (state?.success) {
    return (
      <p className="text-sm text-forest bg-forest/10 rounded-panel px-3 py-2">
        Submitted — your instructor will review and grade this.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <textarea
        name="answer_text"
        rows={4}
        placeholder="Write your answer…"
        className="w-full border border-line rounded-panel px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-rust text-xs">{state.error}</p>}
      <SubmitButton className="text-sm bg-gold text-white rounded-panel px-4 py-2 font-medium hover:opacity-90">
        Submit Answer
      </SubmitButton>
    </form>
  );
}
