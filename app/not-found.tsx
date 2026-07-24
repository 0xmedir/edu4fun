import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <p className="font-display text-6xl mb-4">404</p>
        <h1 className="text-xl font-semibold mb-2">Page not found</h1>
        <p className="text-ink/50 mb-6">The page you're looking for doesn't exist or may have moved.</p>
        <Link href="/dashboard" className="inline-block bg-gold text-white rounded-panel px-5 py-2.5 font-medium hover:opacity-90">
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
