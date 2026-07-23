"use client";

import { useState } from "react";
import { getBookDownloadUrl } from "@/app/actions/library";

type Book = { id: string; title: string; author: string | null; tags: string[] };

export default function LibraryBrowser({ books }: { books: Book[] }) {
  const allTags = Array.from(new Set(books.flatMap((b) => b.tags))).sort();
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const filtered = activeTag ? books.filter((b) => b.tags.includes(activeTag)) : books;

  async function handleDownload(id: string) {
    setDownloading(id);
    try {
      const url = await getBookDownloadUrl(id);
      window.open(url, "_blank");
    } catch {
      alert("Couldn't get download link. Try again.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-4">
      {allTags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTag(null)}
            className={`text-xs rounded-full px-3 py-1 ${!activeTag ? "bg-gold text-white" : "bg-goldsoft text-ink"}`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`text-xs rounded-full px-3 py-1 ${activeTag === tag ? "bg-gold text-white" : "bg-goldsoft text-ink"}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {!filtered.length ? (
        <p className="text-ink/50">No resources match this filter.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((b) => (
            <li key={b.id} className="border border-line rounded-panel p-4 bg-white flex items-center justify-between">
              <div>
                <p className="font-medium">{b.title}</p>
                {b.author && <p className="text-xs text-ink/50">{b.author}</p>}
              </div>
              <button
                onClick={() => handleDownload(b.id)}
                disabled={downloading === b.id}
                className="text-sm bg-goldsoft text-ink rounded-panel px-3 py-1.5 font-medium hover:opacity-80 disabled:opacity-50"
              >
                {downloading === b.id ? "…" : "Download"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
