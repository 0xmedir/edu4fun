"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type FormState = { error?: string };

export async function createCourse(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const semester = String(formData.get("semester") || "").trim();
  const credit_hours = Number(formData.get("credit_hours") || 0) || null;

  if (!title) return { error: "Course title is required." };

  const { data, error } = await supabase
    .from("courses")
    .insert({ title, description, semester, credit_hours, created_by: user.id })
    .select("id")
    .single();

  if (error) return { error: `Couldn't create the course: ${error.message}` };

  redirect(`/admin/courses/${data.id}`);
}

export async function createModule(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = createClient();
  const course_id = String(formData.get("course_id") || "");
  const title = String(formData.get("title") || "").trim();
  const week_number = Number(formData.get("week_number") || 0) || null;
  const learning_objectives = String(formData.get("learning_objectives") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!title || !course_id) return { error: "Module title is required." };

  const { error } = await supabase.from("modules").insert({
    course_id,
    title,
    week_number,
    learning_objectives,
    order_index: week_number ?? 0,
  });

  if (error) return { error: `Couldn't create the module: ${error.message}` };

  redirect(`/admin/courses/${course_id}`);
}

export async function createLesson(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = createClient();
  const module_id = String(formData.get("module_id") || "");
  const course_id = String(formData.get("course_id") || ""); // for the redirect only
  const title = String(formData.get("title") || "").trim();
  const content_richtext = String(formData.get("content_richtext") || "");
  const video_url = String(formData.get("video_url") || "").trim() || null;

  if (!title || !module_id) return { error: "Lesson title is required." };

  const { error } = await supabase.from("lessons").insert({
    module_id,
    title,
    content_richtext,
    video_url,
  });

  if (error) return { error: `Couldn't create the lesson: ${error.message}` };

  redirect(`/admin/courses/${course_id}`);
}
