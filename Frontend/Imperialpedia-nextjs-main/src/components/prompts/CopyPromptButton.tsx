'use client';

import { useState, type MouseEvent } from 'react';
import { toast } from 'sonner';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  /** Parent post slug — the copy counter is tracked per post, not per individual prompt
   * item, since that's the granularity the backend/admin actually reports on. */
  slug: string;
  promptText: string;
  /** Compact form for grid cards (icon-only, small footprint) vs the full-width labeled
   * button used on the post detail page. */
  compact?: boolean;
  className?: string;
}

export function CopyPromptButton({ slug, promptText, compact = false, className }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: MouseEvent) => {
    // Grid cards nest this inside a <Link> to the post — stop the click from also navigating.
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      toast.success('Prompt copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Couldn’t copy — select and copy the text manually');
      return;
    }
    // Fire-and-forget copy counter — never blocks the clipboard action on the network.
    fetch(`/api/prompts/${encodeURIComponent(slug)}/copy`, { method: 'POST' }).catch(() => {});
  };

  if (compact) {
    return (
      <Button type="button" size="sm" variant="secondary" onClick={handleCopy} className={className}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    );
  }

  return (
    <Button type="button" onClick={handleCopy} className={className ?? 'gap-2'}>
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? 'Copied!' : 'Copy prompt'}
    </Button>
  );
}
