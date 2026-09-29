
'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Invitation } from '@/types/contracts';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { invitationService } from '@/services/service';
import { useToast } from '@/components/system/Toast/useToast';
import { adapter } from '@/services/adapter';
import { Check, X } from 'lucide-react';

interface InvitationCardProps {
    invitation: Invitation;
    projectTitle?: string;
    onRespond: () => void;
}

function InvitationCard({ invitation, projectTitle, onRespond }: InvitationCardProps) {
    const { showToast } = useToast();
    const { run: respond, isLoading } = useAsyncAction(invitationService.respond, {
        onSuccess: (res) => {
            showToast({ type: 'success', title: `Invitation ${res?.data?.status}`, description: 'No description provided'});
            onRespond();
        }
    });

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
                <p className="font-semibold text-sm">You have a pending invitation to join:</p>
                <p className="text-sm text-muted-foreground">{projectTitle || 'a project'}</p>
            </div>
            <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => respond(invitation.id, 'Declined')} disabled={isLoading}><X className="h-4 w-4"/></Button>
                <Button size="sm" onClick={() => respond(invitation.id, 'Accepted')} disabled={isLoading}><Check className="h-4 w-4"/></Button>
            </div>
        </div>
    )
}

export function InvitationList({ invitations, onUpdate }: { invitations: Invitation[], onUpdate: () => void }) {
    // Real project titles come from jobs-service /projects (adapter.getProjects). Teams have no
    // backend endpoint yet, so the invite copy is team-agnostic rather than mock-named.
    const [projectTitles, setProjectTitles] = useState<Map<string, string>>(new Map());

    useEffect(() => {
        if (!invitations || invitations.length === 0) return;
        let active = true;
        (async () => {
            try {
                const res = await (adapter as any).getProjects?.({ page: 1, limit: 1000 });
                const rows: any[] = res?.data ?? res ?? [];
                if (active && Array.isArray(rows)) {
                    setProjectTitles(new Map(rows.map((p) => [String(p.id), p.title ?? p.name])));
                }
            } catch {
                /* project enrichment unavailable — fall back to a neutral label */
            }
        })();
        return () => { active = false; };
    }, [invitations]);

    if (!invitations || invitations.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {invitations.map(inv => (
                    <InvitationCard
                        key={inv.id}
                        invitation={inv}
                        projectTitle={projectTitles.get(String(inv.projectId))}
                        onRespond={onUpdate}
                    />
                ))}
            </CardContent>
        </Card>
    );
}
