"use client";

import { useFormState } from "react-dom";
import { submitQuiz, type QuizFormState } from "@/app/actions/quiz";
import SubmitButton from "@/components/SubmitButton";

type Question = {
  id: string;
  question_text: string;
  options: Record<string, string>;
  correct_answer: string;
};

export default function QuizForm({
  courseId,
  quizId,
  questions,
}: {
  courseId: string;
  quizId: string;
  questions: Question[];
}) {
  const boundAction = submitQuiz.bind(null, courseId, quizId);
  const [state, formAction] = useFormState(boundAction, {});

  if (!questions || questions.length === 0) {
    return <p className="text-ink/50">No questions to display.</p>;
  }

  return (
    <form action={formAction} className="space-y-6">
      {questions.map((q, i) => {
        const optionsEntries = Object.entries(q.options);
        return (
          <div key={q.id} className="border border-line rounded-panel p-5 bg-white">
            <p className="text-xs text-ink/50 mb-1">Question {i + 1}</p>
            <p className="font-medium mb-3">{q.question_text}</p>
            <div className="space-y-2">
              {optionsEntries.map(([key, text]) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name={`answer_${q.id}`} value={key} required />
                  <span className="font-medium">{key}.</span> {text}
                </label>
              ))}
            </div>
          </div>
        );
      })}
      {state?.error && <p className="text-rust text-sm">{state.error}</p>}
      <SubmitButton className="bg-gold text-white rounded-panel px-6 py-3 font-medium hover:opacity-90">
        Submit Quiz
      </SubmitButton>
    </form>
  );
}
