'use client';

/**
 * @file journeys/[id]/page.tsx
 * @description One order, start to finish, in plain words. The top card says whose turn it is; the
 * list below shows the seven steps and the records behind each. The server decides what this
 * organisation may see (no prices reach a freight forwarder or customs broker); this page only
 * shows what it is given and says so when a step is a partial view.
 */
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, CheckCircle2, Circle, Clock, Loader2, MinusCircle, Workflow } from 'lucide-react';
import { journeyService, type JourneyStep, type StepState } from '@/services/journey-service';
import { STATE_LABEL, STEP_ACTION, roleLabel, routeLabel, statusLabel } from '@/lib/journey-labels';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EmptyState, InlineError, PageHeader, Panel, PanelSkeleton } from '@/components/dashboard/dashboard-kit';

const STATE_STYLE: Record<StepState, { icon: typeof Circle; ring: string; text: string }> = {
  done: { icon: CheckCircle2, ring: 'text-emerald-600 dark:text-emerald-400', text: 'text-emerald-700 dark:text-emerald-300' },
  in_progress: { icon: Loader2, ring: 'text-primary', text: 'text-primary' },
  waiting: { icon: Clock, ring: 'text-amber-600 dark:text-amber-400', text: 'text-amber-700 dark:text-amber-300' },
  blocked: { icon: AlertTriangle, ring: 'text-destructive', text: 'text-destructive' },
  not_started: { icon: Circle, ring: 'text-muted-foreground', text: 'text-muted-foreground' },
  not_applicable: { icon: MinusCircle, ring: 'text-muted-foreground', text: 'text-muted-foreground' },
};

function StepRow({ step, current }: { step: JourneyStep; current: boolean }) {
  const style = STATE_STYLE[step.state];
  const Icon = style.icon;
  const finished = step.state === 'done' || step.state === 'not_applicable';
  return (
    <li className={cn('rounded-lg border p-4', current && 'border-primary bg-primary/5')} aria-current={current ? 'step' : undefined}>
      <div className="flex items-start gap-3">
        <Icon aria-hidden className={cn('mt-0.5 h-6 w-6 shrink-0', style.ring)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <h3 className="text-base font-semibold">{step.number}. {step.title}</h3>
            <span className={cn('text-sm font-medium', style.text)}>{STATE_LABEL[step.state]}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{step.summary}</p>
          {!finished && step.nextActor && (
            <p className="mt-1 text-sm">
              {step.nextActor.isMyTurn ? <strong>Your turn.</strong> : <>Waiting on the <strong>{step.nextActor.text}</strong>.</>}
            </p>
          )}
          {step.partial && <p className="mt-1 text-sm text-muted-foreground">You can see only the documents shared with you.</p>}
          {step.records.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {step.records.map((r) => (
                <li key={`${r.kind}-${r.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
                  <span className="min-w-0 break-words">{r.title || statusLabel(r.kind)}</span>
                  <span className="text-muted-foreground">{statusLabel(r.status)}</span>
                </li>
              ))}
            </ul>
          )}
          {step.notes?.map((n) => <p key={n} className="mt-2 text-sm text-muted-foreground">{n}</p>)}
        </div>
      </div>
    </li>
  );
}

export default function JourneyPage() {
  const { id } = useParams<{ id: string }>();
  const steps = useQuery({ queryKey: ['journeys', id, 'steps'], queryFn: () => journeyService.steps(id), retry: 1, staleTime: 15_000, refetchInterval: 30_000, enabled: !!id });
  const detail = useQuery({ queryKey: ['journeys', id, 'detail'], queryFn: () => journeyService.detail(id), retry: 1, staleTime: 60_000, enabled: !!id });

  const data = steps.data;
  const current = data?.steps.find((s) => s.key === data.currentStep) ?? null;
  const action = current && current.nextActor?.isMyTurn ? STEP_ACTION[current.key] : undefined;
  const notFound = steps.isError && /not found/i.test((steps.error as Error)?.message || '');

  return (
    <main id="journey" className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      <Link href="/journeys" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft aria-hidden className="h-4 w-4" /> All orders
      </Link>

      {steps.isLoading && <PanelSkeleton rows={5} />}
      {notFound && <EmptyState icon={Workflow} title="We couldn't find this order" description="It may not exist, or you may not be part of it." action={<Button asChild variant="outline" className="min-h-11"><Link href="/journeys">Back to your orders</Link></Button>} />}
      {steps.isError && !notFound && <InlineError message="We couldn't load this order." onRetry={() => void steps.refetch()} />}

      {data && (
        <>
          <PageHeader
            title={data.reference}
            description={`${routeLabel(data.origin, data.destination)}${data.incoterm ? ` · ${data.incoterm}` : ''} · You are the ${roleLabel(data.myRole).toLowerCase()}`}
          />

          <section aria-label="What happens next" className="rounded-xl border bg-card p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">{data.progress.done} of {data.progress.total} steps done</p>
            <div role="progressbar" aria-valuemin={0} aria-valuemax={data.progress.total} aria-valuenow={data.progress.done} aria-label="Order progress" className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${data.progress.total ? (data.progress.done / data.progress.total) * 100 : 0}%` }} />
            </div>
            {current ? (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-lg font-semibold">
                    {current.nextActor?.isMyTurn ? `Your turn: ${current.title}` : `Next: ${current.title}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {current.nextActor?.isMyTurn ? current.summary : `${current.summary} Waiting on the ${current.nextActor?.text ?? 'other party'}.`}
                  </p>
                </div>
                {action && <Button asChild className="min-h-11 w-full sm:w-auto"><Link href={action.href}>{action.label}</Link></Button>}
              </div>
            ) : (
              <p className="mt-4 text-base font-medium">Every step shown here is finished.</p>
            )}
          </section>

          <Panel title="Steps" description="From confirmed order to delivery.">
            <ol className="space-y-3">
              {data.steps.map((s) => <StepRow key={s.key} step={s} current={s.key === data.currentStep} />)}
            </ol>
          </Panel>

          <Panel title="Who is on this order">
            {detail.isLoading && <PanelSkeleton rows={2} />}
            {detail.isError && <InlineError message="We couldn't load the people on this order." onRetry={() => void detail.refetch()} />}
            {detail.data && (
              <ul className="divide-y">
                {detail.data.parties.map((p, i) => (
                  <li key={`${p.role}-${i}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span className="font-medium">{roleLabel(p.role)}{p.externalName ? ` · ${p.externalName}` : ''}</span>
                    <span className="text-muted-foreground">{p.status === 'invited' ? 'Invited' : p.externalName && !p.orgId ? 'Tracked by Baalvion' : 'On the order'}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </main>
  );
}
