'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Crown, LayoutList } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useInquiries, useUpdateInquiry } from '@/lib/queries/crm.queries';
import { useUIStore } from '@/lib/store/uiStore';
import type { Inquiry, InquiryStatus } from '@/lib/types/crm.types';

// Linear sales pipeline (mirrors crm-service's LEAD_STATUSES / CONSIGNMENT_TRANSITIONS-style
// forward flow). won/lost are terminal — reachable from any working stage, not just the last one.
const PIPELINE_STAGES: InquiryStatus[] = ['new', 'contacted', 'qualifying', 'presenting', 'closing'];
const TERMINAL_STAGES: InquiryStatus[] = ['won', 'lost'];

const STAGE_LABEL: Record<string, string> = {
  new: 'New', contacted: 'Contacted', qualifying: 'Qualifying', presenting: 'Presenting',
  closing: 'Closing', won: 'Won', lost: 'Lost',
};

export default function InquiriesPipelinePage() {
  const { setBreadcrumbs } = useUIStore();
  // No drag-and-drop dependency in this app yet — stage moves are explicit buttons on each
  // card (prev/next stage), which also makes the transition auditable in the update payload.
  const { data, isLoading } = useInquiries({ limit: 200 });
  const updateInquiry = useUpdateInquiry();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'CRM & Marketing', href: '/crm' },
      { label: 'Inquiries', href: '/crm/inquiries' },
      { label: 'Pipeline' },
    ]);
  }, [setBreadcrumbs]);

  const rows = useMemo(() => data?.items ?? [], [data]);
  const byStage = useMemo(() => {
    const map = new Map<string, Inquiry[]>();
    for (const stage of [...PIPELINE_STAGES, ...TERMINAL_STAGES]) map.set(stage, []);
    for (const row of rows) {
      const bucket = map.get(row.status) ?? map.get('lost')!;
      bucket.push(row);
    }
    return map;
  }, [rows]);

  const moveStage = (inquiry: Inquiry, direction: 1 | -1) => {
    const idx = PIPELINE_STAGES.indexOf(inquiry.status);
    if (idx === -1) return;
    const next = PIPELINE_STAGES[idx + direction];
    if (!next) return;
    updateInquiry.mutate({ id: inquiry.id, payload: { status: next } });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Pipeline"
        description="Drag-free kanban of every open inquiry, grouped by stage"
        actions={
          <Link href="/crm/inquiries">
            <Button variant="outline" size="sm"><LayoutList className="mr-1.5 h-3.5 w-3.5" /> Table view</Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {PIPELINE_STAGES.map((stage, stageIdx) => {
            const cards = byStage.get(stage) ?? [];
            return (
              <Card key={stage} className="bg-muted/30">
                <CardHeader className="pb-2 pt-3 px-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide">{STAGE_LABEL[stage]}</p>
                    <span className="text-xs text-muted-foreground">{cards.length}</span>
                  </div>
                </CardHeader>
                <CardContent className="px-2 pb-2 space-y-2 min-h-[120px]">
                  {cards.length === 0 && (
                    <p className="text-xs text-muted-foreground/60 text-center py-6">No leads</p>
                  )}
                  {cards.map((inquiry) => (
                    <div key={inquiry.id} className="rounded-md border bg-background p-2.5 space-y-2 text-xs">
                      <Link href={`/crm/inquiries/${inquiry.id}`} className="block hover:underline">
                        <p className="font-medium truncate">{inquiry.customerName}</p>
                      </Link>
                      <p className="text-muted-foreground truncate">
                        {[inquiry.intent, inquiry.budgetRange].filter(Boolean).join(' · ') || '—'}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        {inquiry.leadTier ? (
                          <span className="inline-flex items-center gap-1"><Crown className="h-3 w-3" /> Tier {inquiry.leadTier}</span>
                        ) : <span />}
                        {inquiry.assignedToName && <span className="truncate max-w-[80px]">{inquiry.assignedToName}</span>}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <Button
                          variant="ghost" size="sm" className="h-6 w-6 p-0"
                          disabled={stageIdx === 0 || updateInquiry.isPending}
                          onClick={() => moveStage(inquiry, -1)}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <div className="flex gap-1">
                          <Button
                            variant="outline" size="sm" className="h-6 px-1.5 text-[10px] text-destructive"
                            disabled={updateInquiry.isPending}
                            onClick={() => updateInquiry.mutate({ id: inquiry.id, payload: { status: 'lost' } })}
                          >
                            Lost
                          </Button>
                          {stageIdx === PIPELINE_STAGES.length - 1 && (
                            <Button
                              variant="outline" size="sm" className="h-6 px-1.5 text-[10px] text-emerald-600"
                              disabled={updateInquiry.isPending}
                              onClick={() => updateInquiry.mutate({ id: inquiry.id, payload: { status: 'won' } })}
                            >
                              Won
                            </Button>
                          )}
                        </div>
                        <Button
                          variant="ghost" size="sm" className="h-6 w-6 p-0"
                          disabled={stageIdx === PIPELINE_STAGES.length - 1 || updateInquiry.isPending}
                          onClick={() => moveStage(inquiry, 1)}
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
