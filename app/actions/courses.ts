"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { parseCourseOutline } from "@/lib/parseCourseOutline";

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
  const department_id = String(formData.get("department_id") || "") || null;

  if (!title) return { error: "Course title is required." };

  const { data, error } = await supabase
    .from("courses")
    .insert({ title, description, semester, credit_hours, department_id, created_by: user.id })
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const module_id = String(formData.get("module_id") || "");
  const course_id = String(formData.get("course_id") || "");
  const title = String(formData.get("title") || "").trim();
  const content_richtext = String(formData.get("content_richtext") || "");
  const video_url = String(formData.get("video_url") || "").trim() || null;
  const pdfFile = formData.get("pdf_file") as File | null;

  if (!title || !module_id) return { error: "Lesson title is required." };

  let pdf_url: string | null = null;
  if (pdfFile && pdfFile.size > 0) {
    if (pdfFile.type !== "application/pdf") {
      return { error: "Lesson attachment must be a PDF file." };
    }
    if (pdfFile.size > 10 * 1024 * 1024) {
      return { error: "PDF is larger than 10MB." };
    }
    const admin = createAdminClient();
    const path = `lesson-pdfs/${crypto.randomUUID()}.pdf`;
    const arrayBuffer = await pdfFile.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from("library")
      .upload(path, Buffer.from(arrayBuffer), { contentType: "application/pdf" });
    if (uploadError) return { error: `PDF upload failed: ${uploadError.message}` };
    pdf_url = path;
  }

  const { error } = await supabase.from("lessons").insert({
    module_id,
    title,
    content_richtext,
    video_url,
    pdf_url,
  });

  if (error) return { error: `Couldn't create the lesson: ${error.message}` };

  redirect(`/admin/courses/${course_id}`);
}

export async function bulkImportOutline(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = createClient();
  const course_id = String(formData.get("course_id") || "");
  const raw = String(formData.get("outline") || "");

  if (!course_id) return { error: "Missing course." };

  const modules = parseCourseOutline(raw);
  if (!modules.length) {
    return {
      error: "Couldn't find any '## Week N: Title' headers — check the format in the example below.",
    };
  }

  for (const [index, mod] of modules.entries()) {
    const { data: insertedModule, error: modError } = await supabase
      .from("modules")
      .insert({
        course_id,
        title: mod.title,
        week_number: mod.week_number ?? index + 1,
        learning_objectives: mod.learning_objectives,
        order_index: mod.week_number ?? index + 1,
      })
      .select("id")
      .single();

    if (modError || !insertedModule) {
      return { error: `Failed on module "${mod.title}": ${modError?.message}` };
    }

    for (const [lIndex, lesson] of mod.lessons.entries()) {
      const { error: lessonError } = await supabase.from("lessons").insert({
        module_id: insertedModule.id,
        title: lesson.title,
        content_richtext: lesson.content_html,
        video_url: lesson.video_url,
        order_index: lIndex,
      });
      if (lessonError) {
        return { error: `Module "${mod.title}" saved, but lesson "${lesson.title}" failed: ${lessonError.message}` };
      }
    }
  }

  redirect(`/admin/courses/${course_id}`);
}
