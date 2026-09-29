'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StageHistory } from '@/types';
import { CANDIDATE_JOURNEY, getStageLabel } from '@/lib/candidate/statusEngine';
import { Check, Circle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApplicationTimelineProps {
    stageHistory: StageHistory[];
    currentStage: string;
    /** When the application was submitted — the one date we always know. */
    appliedAt?: string | Date;
}

const formatDate = (iso?: string | Date | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * Where the application stands.
 *
 * There is no per-stage audit trail behind this yet — the application carries one
 * current status — so this shows the real track with the current position marked, and
 * dates ONLY where a real timestamp exists. It never invents a date for a stage.
 * If a genuine stage history is supplied, that wins.
 */
export function ApplicationTimeline({ stageHistory, currentStage, appliedAt }: ApplicationTimelineProps) {
    const history = Array.isArray(stageHistory) ? stageHistory : [];
    const stage = String(currentStage || 'APPLIED').toUpperCase();
    const isClosed = stage === 'REJECTED' || stage === 'WITHDRAWN';

    if (history.length > 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Application Timeline</CardTitle></CardHeader>
                <CardContent>
                    <ol className="relative ml-3 border-l">
                        {history.map((item) => (
                            <li key={item.id} className="mb-8 ml-6">
                                <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 ring-8 ring-background">
                                    <Check className="h-3.5 w-3.5 text-primary" />
                                </span>
                                <h3 className="text-sm font-semibold">{getStageLabel(item.stage)}</h3>
                                <time className="text-xs text-muted-foreground">
                                    {formatDate(item.timestamp) ?? ''}
                                </time>
                            </li>
                        ))}
                    </ol>
                </CardContent>
            </Card>
        );
    }

    const currentIndex = CANDIDATE_JOURNEY.indexOf(stage as (typeof CANDIDATE_JOURNEY)[number]);

    return (
        <Card>
            <CardHeader><CardTitle>Application Timeline</CardTitle></CardHeader>
            <CardContent>
                <ol className="relative ml-3 border-l">
                    {CANDIDATE_JOURNEY.map((s, i) => {
                        // A closed application keeps whatever it had reached; nothing past
                        // the current stage is ever shown as done.
                        const reached = !isClosed && currentIndex >= 0 && i <= currentIndex;
                        const isCurrent = !isClosed && i === currentIndex;
                        const date = i === 0 ? formatDate(appliedAt) : null;
                        return (
                            <li key={s} className="mb-7 ml-6 last:mb-0">
                                <span
                                    className={cn(
                                        'absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-background',
                                        reached ? 'bg-primary/10' : 'bg-muted',
                                    )}
                                >
                                    {reached
                                        ? <Check className="h-3.5 w-3.5 text-primary" />
                                        : <Circle className="h-2 w-2 fill-muted-foreground/40 text-muted-foreground/40" />}
                                </span>
                                <h3 className={cn('text-sm', isCurrent ? 'font-semibold' : reached ? 'font-medium' : 'text-muted-foreground')}>
                                    {getStageLabel(s)}
                                </h3>
                                {date && <time className="text-xs text-muted-foreground">{date}</time>}
                                {isCurrent && <p className="text-xs text-primary">Current stage</p>}
                            </li>
                        );
                    })}
                    {isClosed && (
                        <li className="ml-6">
                            <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-destructive/10 ring-8 ring-background">
                                <XCircle className="h-3.5 w-3.5 text-destructive" />
                            </span>
                            <h3 className="text-sm font-semibold">{getStageLabel(stage)}</h3>
                        </li>
                    )}
                </ol>
            </CardContent>
        </Card>
    );
}
