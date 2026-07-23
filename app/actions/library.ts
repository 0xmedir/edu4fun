"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type LibraryFormState = { error?: string };

const ALLOWED_TYPES = [
  "application/pdf",
  "application/epub+zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

export async function uploadBook(
  _prev: LibraryFormState,
  formData: FormData
): Promise<LibraryFormState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const title = String(formData.get("title") || "").trim();
  const author = String(formData.get("author") || "").trim();
  const tagsRaw = String(formData.get("tags") || "").trim();
  const file = formData.get("file") as File | null;

  if (!title) return { error: "Title is required." };
  if (!file || file.size === 0) return { error: "Choose a file to upload." };
  if (file.size > 10 * 1024 * 1024) return { error: "File is larger than 10MB." };
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Only PDF, EPUB, or DOCX files are supported." };
  }

  const admin = createAdminClient();
  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage
    .from("library")
    .upload(path, Buffer.from(arrayBuffer), { contentType: file.type });

  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

  const { data: book, error: bookError } = await supabase
    .from("books")
    .insert({ title, author, file_url: path, uploaded_by: user.id })
    .select("id")
    .single();

  if (bookError || !book) return { error: `Couldn't save book record: ${bookError?.message}` };

  const tagNames = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
  for (const name of tagNames) {
    let { data: tag } = await supabase
      .from("subject_tags")
      .select("id")
      .eq("name", name)
      .maybeSingle();

    if (!tag) {
      const { data: newTag } = await supabase
        .from("subject_tags")
        .insert({ name })
        .select("id")
        .single();
      tag = newTag;
    }

    if (tag) {
      await supabase.from("book_tags").insert({ book_id: book.id, tag_id: tag.id });
    }
  }

  revalidatePath("/admin/library");
  revalidatePath("/library");
  return {};
}

export async function getBookDownloadUrl(bookId: string): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: book } = await supabase.from("books").select("file_url").eq("id", bookId).single();
  if (!book) throw new Error("Book not found.");

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("library").createSignedUrl(book.file_url, 300);
  if (error || !data) throw new Error("Couldn't generate download link.");
  return data.signedUrl;
}
