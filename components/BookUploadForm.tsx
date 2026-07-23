"use client";

import { useFormState } from "react-dom";
import { uploadBook, type LibraryFormState } from "@/app/actions/library";
import SubmitButton from "@/components/SubmitButton";

const initial: LibraryFormState = {};

export default function BookUploadForm() {
  const [state, formAction] = useFormState(uploadBook, initial);

  return (
    <form action={formAction} className="space-y-3 bg-white border border-line rounded-panel p-5">
      <h3 className="font-semibold text-sm">Upload a resource</h3>
      <input name="title" placeholder="Title" required className="w-full border border-line rounded-panel px-3 py-2 text-sm" />
      <input name="author" placeholder="Author (optional)" className="w-full border border-line rounded-panel px-3 py-2 text-sm" />
      <input name="tags" placeholder="Subject tags, comma separated (e.g. Calculus, Economics)" className="w-full border border-line rounded-panel px-3 py-2 text-sm" />
      <input name="file" type="file" accept=".pdf,.epub" required className="w-full text-sm" />
      {state?.error && <p className="text-rust text-xs">{state.error}</p>}
      <SubmitButton className="text-sm bg-gold text-white rounded-panel px-4 py-2 font-medium hover:opacity-90">
        Upload
      </SubmitButton>
    </form>
  );
}
