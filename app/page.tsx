"use client";

import { useFormState } from "react-dom";
import { redeemAccessCode, type RedeemState } from "@/app/actions/redeem";
import CodeInput from "@/components/CodeInput";

const initialState: RedeemState = {};

export default function LandingPage() {
  const [state, formAction] = useFormState(redeemAccessCode, initialState);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-semibold mb-1">Edu4Fun</h1>
        <p className="text-ink/60 mb-8">Private study portal — invitation only.</p>

        <form
          action={formAction}
          className="space-y-6 bg-white border border-line rounded-panel p-8"
        >
          <div>
            <label className="block text-sm font-medium mb-2">
              6-digit access code
            </label>
            <CodeInput name="code" />
          </div>

          <div className="space-y-4 border-t border-line pt-5">
            <p className="text-xs text-ink/50">
              First time here? Finish setting up your account below.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">Full name</label>
              <input
                name="fullName"
                required
                className="w-full border border-line rounded-panel px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                name="email"
                type="email"
                required
                className="w-full border border-line rounded-panel px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className="w-full border border-line rounded-panel px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
          </div>

          {state?.error && (
            <p className="text-rust text-sm" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-gold text-white rounded-panel py-3 font-medium hover:opacity-90 transition"
          >
            Enter
          </button>
        </form>
      </div>
    </main>
  );
}
