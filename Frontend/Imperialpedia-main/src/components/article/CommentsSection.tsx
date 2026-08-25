"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import type { ArticleComment } from "@/services/data/cms-public";

interface Props {
  slug: string;
  initialComments: ArticleComment[];
}

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

type Status = "idle" | "submitting" | "submitted" | "error";

export function CommentsSection({ slug, initialComments }: Props) {
  const [comments] = useState(initialComments);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch(`/api/article-engagement/${encodeURIComponent(slug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: name, authorEmail: email, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Could not submit your comment.");
      setStatus("submitted");
      setName("");
      setEmail("");
      setBody("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not submit your comment.");
    }
  };

  return (
    <section className="border-t border-border pt-8">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-foreground">
        <MessageCircle className="h-5 w-5" />
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      {comments.length > 0 && (
        <ul className="mb-8 space-y-6">
          {comments.map((c) => (
            <li key={c.id} className="border-b border-border pb-6 last:border-0 last:pb-0">
              <div className="mb-1.5 flex items-baseline gap-2">
                <span className="text-sm font-bold text-foreground">{c.authorName}</span>
                <span className="text-xs text-muted-foreground">{dateFormatter.format(new Date(c.createdAt))}</span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      {status === "submitted" ? (
        <p className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Thanks — your comment is in for review and will appear once approved.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              required
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              type="email"
              required
              placeholder="Email (not published)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <textarea
            required
            rows={3}
            placeholder="Add a comment..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={status === "submitting"}
            className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {status === "submitting" ? "Posting..." : "Post comment"}
          </button>
        </form>
      )}
    </section>
  );
}
