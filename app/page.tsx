"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { redeemAccessCode, type RedeemState } from "@/app/actions/redeem";
import { signIn, type SignInState } from "@/app/actions/auth";
import CodeInput from "@/components/CodeInput";

const initialRedeemState: RedeemState = {};
const initialSignInState: SignInState = {};

export default function LandingPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [redeemState, redeemAction] = useFormState(redeemAccessCode, initialRedeemState);
  const [signInState, signInAction] = useFormState(signIn, initialSignInState);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-semibold mb-1">Edu4Fun</h1>
        <p className="text-ink/60 mb-8">Private study portal — invitation only.</p>

        <div className="flex mb-6 border border-line rounded-panel overflow-hidden">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 py-2.5 text-sm font-medium transition ${
              mode === "signin" ? "bg-gold text-white" : "bg-white text-ink/60"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-2.5 text-sm font-medium transition ${
              mode === "signup" ? "bg-gold text-white" : "bg-white text-ink/60"
            }`}
          >
            First Time? Sign Up
          </button>
        </div>

        {mode === "signin" ? (
          <form
            action={signInAction}
            className="space-y-4 bg-white border border-line rounded-panel p-8"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full border border-line rounded-panel px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full border border-line rounded-panel px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            {signInState?.error && (
              <p className="text-rust text-sm" role="alert">
                {signInState.error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-gold text-white rounded-panel py-3 font-medium hover:opacity-90 transition"
            >
              Sign In
            </button>
          </form>
        ) : (
          <form
            action={redeemAction}
            className="space-y-6 bg-white border border-line rounded-panel p-8"
          >
            <div>
              <label className="block text-sm font-medium mb-2">
                6-digit access code
              </label>
              <CodeInput name="code" />
            </div>

            <div className="space-y-4 border-t border-line pt-5">
              <div>
                <label className="block text-sm font-medium mb-1">Full name</label>
                <input
                  name="fullName"
                  required
                  autoComplete="name"
                  className="w-full border border-line rounded-panel px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
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
                  autoComplete="new-password"
                  className="w-full border border-line rounded-panel px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </div>

            {redeemState?.error && (
              <p className="text-rust text-sm" role="alert">
                {redeemState.error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-gold text-white rounded-panel py-3 font-medium hover:opacity-90 transition"
            >
              Create Account
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
