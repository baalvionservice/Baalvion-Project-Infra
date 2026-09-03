'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { messageService, type ApplicationMessage } from '@/services/message.service';

const MAX_LENGTH = 5000;

function formatSent(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/**
 * The candidate↔recruiter thread on one application. The same component serves both
 * sides — `side` says whose messages are "mine", which is the only thing that differs.
 */
export function MessageThread({
  applicationId,
  side,
  title = 'Messages',
  description,
}: {
  applicationId: string;
  side: 'candidate' | 'staff';
  title?: string;
  description?: string;
}) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ApplicationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const rows = await messageService.list(applicationId, side);
      if (!cancelled) {
        setMessages(rows);
        setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [applicationId, side]);

  useEffect(() => {
    if (messages.length) endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body || isSending) return;
    setIsSending(true);
    try {
      const sent = await messageService.send(applicationId, body, side);
      setMessages((prev) => [...prev, sent]);
      setDraft('');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Message not sent',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const counterpart = side === 'candidate' ? 'the hiring team' : 'the candidate';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description ?? `Anything you send here reaches ${counterpart} by email as well.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="ml-auto h-16 w-3/4" />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation below.
          </p>
        ) : (
          <div className="max-h-[26rem] space-y-4 overflow-y-auto pr-1">
            {messages.map((m) => {
              const mine = m.senderType === side;
              return (
                <div key={m.id} className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-2.5 text-sm',
                      mine ? 'bg-primary text-primary-foreground' : 'bg-muted',
                    )}
                  >
                    {m.body}
                  </div>
                  <p className="px-1 text-xs text-muted-foreground">
                    {mine ? 'You' : m.senderName || (m.senderType === 'staff' ? 'Talent Team' : 'Candidate')}
                    {' · '}
                    {formatSent(m.createdAt)}
                  </p>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        )}

        <div className="space-y-2 border-t pt-4">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
            placeholder={side === 'candidate' ? 'Ask about your application…' : 'Reply to the candidate…'}
            rows={3}
            // Enter sends; Shift+Enter is a newline — the convention people already expect
            // from every other message box.
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {draft.length > MAX_LENGTH - 500 ? `${MAX_LENGTH - draft.length} characters left` : 'Shift + Enter for a new line'}
            </span>
            <Button size="sm" onClick={send} disabled={!draft.trim() || isSending}>
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
