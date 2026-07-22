"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type RedeemState = {
  error?: string;
};

export async function redeemAccessCode(
  _prevState: RedeemState,
  formData: FormData
): Promise<RedeemState> {
  const code = String(formData.get("code") || "").trim();
  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!/^\d{6}$/.test(code)) {
    return { error: "Enter the 6-digit code exactly as you received it." };
  }
  if (!fullName || !email || password.length < 8) {
    return {
      error: "Full name, email, and an 8+ character password are required.",
    };
  }

  const admin = createAdminClient();

  // 1. Validate the code — must exist, be unused, and not be expired.
  const { data: accessCode, error: lookupError } = await admin
    .from("access_codes")
    .select("id, status, expires_at")
    .eq("code", code)
    .single();

  if (lookupError || !accessCode) {
    return { error: "That code isn't recognized." };
  }
  if (accessCode.status !== "unused") {
    return { error: "That code has already been used." };
  }
  if (new Date(accessCode.expires_at) < new Date()) {
    await admin
      .from("access_codes")
      .update({ status: "expired" })
      .eq("id", accessCode.id);
    return { error: "That code has expired. Ask an admin to issue a new one." };
  }

  // 2. Create the Auth user (service role — bypasses email confirmation
  //    since the invite itself IS the verification step).
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError || !created.user) {
    return {
      error:
        createError?.message.includes("already been registered")
          ? "That email already has an account — try logging in instead."
          : "Couldn't create the account. Try again.",
    };
  }

  // 3. Link the profile row and burn the code, as one unit.
  const { error: profileError } = await admin.from("users").insert({
    id: created.user.id,
    full_name: fullName,
    role: "student",
    access_code_id: accessCode.id,
  });

  if (profileError) {
    // Roll back the orphaned auth user so the code can be retried cleanly.
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "Something went wrong setting up your profile." };
  }

  await admin
    .from("access_codes")
    .update({ status: "used", used_by: created.user.id })
    .eq("id", accessCode.id);

  // 4. Sign the new user in for real, on the request-scoped server client.
  const supabase = createServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: "Account created — please log in." };
  }

  redirect("/dashboard");
}
