import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function NavBar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const isStaff = profile?.role === "admin" || profile?.role === "instructor";

  return (
    <nav className="border-b border-line bg-white sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between flex-wrap gap-2">
        <Link href="/dashboard" className="font-display font-semibold text-lg">
          Edu4Fun
        </Link>
        <div className="flex gap-1 flex-wrap text-sm">
          <Link href="/dashboard" className="px-3 py-1.5 rounded-panel hover:bg-paper">Dashboard</Link>
          <Link href="/library" className="px-3 py-1.5 rounded-panel hover:bg-paper">Library</Link>
          <Link href="/messages" className="px-3 py-1.5 rounded-panel hover:bg-paper">Messages</Link>
          <Link href="/grades" className="px-3 py-1.5 rounded-panel hover:bg-paper">Grades</Link>
          {isStaff && (
            <Link href="/admin/courses" className="px-3 py-1.5 rounded-panel bg-goldsoft text-ink hover:opacity-80">
              Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
