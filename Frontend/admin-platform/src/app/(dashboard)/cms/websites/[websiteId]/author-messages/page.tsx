'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, MailOpen, CircleDot } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useWebsite } from '@/lib/queries/cms-websites.queries';
import {
  useAuthorMessages,
  useMarkAuthorMessageRead,
  useMarkAuthorMessageUnread,
} from '@/lib/queries/cms-author-messages.queries';
import { useUIStore } from '@/lib/store/uiStore';
import type { AuthorMessage } from '@/lib/types/cms-author-messages.types';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export default function AuthorMessagesPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const { setBreadcrumbs } = useUIStore();
  const { data: website } = useWebsite(websiteId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useAuthorMessages(websiteId, { limit: 100 });
  const markRead = useMarkAuthorMessageRead(websiteId);
  const markUnread = useMarkAuthorMessageUnread(websiteId);
  const messages: AuthorMessage[] = data?.data ?? [];
  const unreadCount = messages.filter((m) => m.status === 'unread').length;

  useEffect(() => {
    setBreadcrumbs([
      { label: 'CMS', href: '/cms' },
      { label: website?.name ?? '...', href: `/cms/websites/${websiteId}` },
      { label: 'Author Messages' },
    ]);
  }, [website, setBreadcrumbs, websiteId]);

  const toggleExpand = (message: AuthorMessage) => {
    setExpandedId((current) => (current === message.id ? null : message.id));
    if (message.status === 'unread') markRead.mutate(message.id);
  };

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href={`/cms/websites/${websiteId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {website?.name ?? 'Website'}
          </Link>
        </Button>
        <PageHeader
          title="Author Messages"
          description={`Messages readers sent through "Contact the Author" on ${website?.name ?? 'this site'}'s author pages.${
            unreadCount > 0 ? ` ${unreadCount} unread.` : ''
          }`}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : messages.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No messages yet. They&apos;ll show up here as soon as a reader uses the &quot;Contact the
          Author&quot; form on any author page.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>From</TableHead>
              <TableHead>For author</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Received</TableHead>
              <TableHead className="text-right">Emailed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.map((m) => {
              const expanded = expandedId === m.id;
              return (
                <TableRow
                  key={m.id}
                  className={`cursor-pointer ${m.status === 'unread' ? 'font-semibold bg-muted/40' : ''}`}
                  onClick={() => toggleExpand(m)}
                >
                  <TableCell>
                    {m.status === 'unread' ? (
                      <CircleDot className="h-3.5 w-3.5 text-orange-500" />
                    ) : (
                      <span className="block h-3.5 w-3.5" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div>{m.senderName}</div>
                    <div className="text-xs text-muted-foreground font-normal">{m.senderEmail}</div>
                  </TableCell>
                  <TableCell className="font-normal">{m.authorName}</TableCell>
                  <TableCell className="font-normal max-w-md">
                    <p className={expanded ? 'whitespace-pre-wrap' : 'truncate'}>{m.message}</p>
                  </TableCell>
                  <TableCell className="font-normal whitespace-nowrap">
                    {dateFormatter.format(new Date(m.createdAt))}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Badge variant={m.emailDelivered ? 'default' : 'outline'}>
                        {m.emailDelivered ? 'Sent' : 'Not sent'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={m.status === 'unread' ? 'Mark as read' : 'Mark as unread'}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (m.status === 'unread') markRead.mutate(m.id);
                          else markUnread.mutate(m.id);
                        }}
                      >
                        {m.status === 'unread' ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
