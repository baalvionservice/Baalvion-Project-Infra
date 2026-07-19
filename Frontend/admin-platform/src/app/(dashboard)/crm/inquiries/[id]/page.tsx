'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChevronLeft, Send, Crown, Globe, Mail, Package } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format';
import { useInquiry, useAddInquiryMessage, useUpdateInquiry } from '@/lib/queries/crm.queries';
import { useUIStore } from '@/lib/store/uiStore';
import type { InquiryStatus } from '@/lib/types/crm.types';

const STATUS_OPTIONS: InquiryStatus[] = ['new', 'contacted', 'qualifying', 'presenting', 'closing', 'won', 'lost'];

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { setBreadcrumbs } = useUIStore();
  const { data: inquiry, isLoading } = useInquiry(id);
  const addMessage = useAddInquiryMessage(id);
  const updateInquiry = useUpdateInquiry();
  const [reply, setReply] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'CRM & Marketing', href: '/crm' },
      { label: 'Inquiries', href: '/crm/inquiries' },
      { label: inquiry?.customerName ?? id },
    ]);
  }, [setBreadcrumbs, inquiry?.customerName, id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [inquiry?.messages]);

  const handleSend = () => {
    if (!reply.trim()) return;
    addMessage.mutate(reply.trim(), { onSuccess: () => setReply('') });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">Inquiry not found.</p>
        <Link href="/crm/inquiries" className="text-sm text-primary underline mt-2 inline-block">Back to Inquiries</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={inquiry.customerName}
        titleAdornment={<StatusBadge status={inquiry.status} className="text-xs" />}
        description={inquiry.email ?? undefined}
        actions={
          <Link href="/crm/inquiries">
            <Button variant="outline" size="sm"><ChevronLeft className="mr-1 h-4 w-4" /> Back</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metadata sidebar */}
        <Card className="lg:order-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Status</label>
              <Select
                value={inquiry.status}
                onValueChange={(v) =>
                  updateInquiry.mutate({ id: inquiry.id, payload: { status: v as InquiryStatus } })
                }
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <InfoRow icon={<Crown className="h-3.5 w-3.5" />} label="Lead Tier" value={inquiry.leadTier ? `Tier ${inquiry.leadTier}` : '—'} />
            <InfoRow icon={<Globe className="h-3.5 w-3.5" />} label="Market" value={inquiry.country ?? '—'} />
            <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Contact via" value={inquiry.contactMethod ?? '—'} />
            <InfoRow icon={<Package className="h-3.5 w-3.5" />} label="Reference" value={inquiry.productId ?? inquiry.serviceId ?? 'Unspecified'} />
            <div className="pt-2 border-t space-y-1">
              <p className="text-xs text-muted-foreground">Budget</p>
              <p>{inquiry.budgetRange ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Intent</p>
              <p>{inquiry.intent ?? '—'}</p>
            </div>
            {inquiry.message && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Original brief</p>
                <p className="text-sm leading-relaxed">{inquiry.message}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Thread */}
        <Card className="lg:col-span-2 lg:order-1 flex flex-col h-[640px]">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-medium">Dialogue</CardTitle>
          </CardHeader>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {(inquiry.messages ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No messages yet — reply below to start the dialogue.</p>
            ) : (
              inquiry.messages!.map((m) => (
                <div key={m.id} className={cn('flex', m.sender === 'curator' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[75%] rounded-lg px-4 py-2.5 text-sm',
                      m.sender === 'curator' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                    <p className={cn('text-[10px] mt-1.5', m.sender === 'curator' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                      {m.sender === 'curator' ? 'You' : inquiry.customerName} · {formatDate(m.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t p-4 space-y-2">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Reply to this customer..."
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSend} disabled={!reply.trim() || addMessage.isPending}>
                {addMessage.isPending ? 'Sending…' : 'Send'} <Send className="ml-2 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
