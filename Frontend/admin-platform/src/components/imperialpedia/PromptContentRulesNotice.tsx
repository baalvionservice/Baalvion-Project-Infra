import { Info } from 'lucide-react';

/**
 * Standing content/SEO rules for the AI-prompt directory, shown directly in the admin panel
 * (list + create/edit) rather than living only in someone's head or a Slack thread — whoever
 * adds a prompt post next sees the same checklist every time, without having to ask.
 */
export function PromptContentRulesNotice() {
  return (
    <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-200">
      <div className="flex items-start gap-2.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
        <div className="space-y-1.5">
          <p className="font-semibold">Before publishing (or un-archiving) a prompt post</p>
          <ul className="list-disc space-y-1 pl-4 text-sky-800/90 dark:text-sky-200/80">
            <li>
              <strong>Every prompt needs its real example image</strong> — the exact output that
              prompt produced, not a stock photo. A post still showing &quot;EXAMPLE IMAGE
              PENDING&quot; is live on the site and in the sitemap, but hidden from Google Images
              and social-share previews until the real photo replaces it.
            </li>
            <li>
              <strong>Prompt text must be the real, tested prompt</strong> — exact wording that
              produced the shown image, not a paraphrase or an untested guess.
            </li>
            <li>
              <strong>Category</strong> must be one of the live category slugs (see the Prompts
              list for what&apos;s active) — an unlisted or archived category won&apos;t appear in
              site navigation even if the post itself is active.
            </li>
            <li>
              <strong>Slug is the canonical URL</strong> — avoid changing it after publishing;
              existing links, the sitemap, and search rankings all point at it.
            </li>
            <li>
              <strong>Trending is editorial, not automatic</strong> — toggling it on puts the post
              on /trending-prompts immediately, so only flip it for something you actually want
              featured right now.
            </li>
            <li>
              <strong>Archive to take a post down</strong> — it disappears from the site and
              sitemap immediately, but stays recoverable (un-archive any time); nothing here is a
              hard delete.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
