
'use client';
import { useState, useEffect } from 'react';
import { DataTable, DataColumn } from '@/components/system/DataTable';
import { ProjectApplication, MatchScore, ReputationSummary } from '@/types/contracts';
import { adapter } from '@/services/adapter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { useToast } from '@/components/system/Toast/useToast';

interface RankedApplicationListProps {
    applications: ProjectApplication[];
}

// Real contractor identity comes from jobs-service /users (adapter.getUsers). Reputation
// (averageRating/totalReviews) is only present once a reviews backend exists — until then it
// is simply omitted (no fabricated values, no hidden mock fallback).
type Contractor = { id: string; name?: string; fullName?: string; avatarUrl?: string; reputationSummary?: ReputationSummary };

const getTopMatchBadge = (rank?: number) => {
    if (rank === 1) return <Badge className="bg-green-100 text-green-800">Top Match</Badge>;
    if (rank && rank <= 3) return <Badge className="bg-blue-100 text-blue-800">High Potential</Badge>;
    return null;
}

export function RankedApplicationList({ applications }: RankedApplicationListProps) {
    const { showToast } = useToast();
    const [query, setQuery] = useState({ page: 1, limit: 10 });
    const [contractors, setContractors] = useState<Map<string, Contractor>>(new Map());

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const users = (await (adapter as any).getUsers?.()) as Contractor[] | undefined;
                if (active && Array.isArray(users)) {
                    setContractors(new Map(users.map((u) => [String(u.id), u])));
                }
            } catch {
                /* identity enrichment unavailable — fall back to the application's contractorId */
            }
        })();
        return () => { active = false; };
    }, []);

    const getContractor = (id: string): Contractor | undefined => contractors.get(String(id));
    const contractorLabel = (id: string) => {
        const c = getContractor(id);
        return c?.fullName || c?.name || `Contractor ${String(id).slice(0, 8)}`;
    };

    const handleAccept = (appName: string) => {
        showToast({ type: 'success', title: 'Contractor Selected!', description: `You have selected ${appName} for this project.` })
    }

    const columns: DataColumn<ProjectApplication>[] = [
        {
            key: 'rankingPosition',
            header: 'Rank',
            render: (row) => <div className="font-bold text-lg text-center">{row.matchScore?.rankingPosition}</div>,
            align: 'center'
        },
        {
            key: 'contractor',
            header: 'Contractor',
            render: (row) => {
                const contractor = getContractor(row.contractorId);
                const rating = contractor?.reputationSummary?.averageRating;
                const reviews = contractor?.reputationSummary?.totalReviews;
                return (
                    <div className="flex items-center gap-3">
                        <Avatar><AvatarImage src={contractor?.avatarUrl} /><AvatarFallback>{contractorLabel(row.contractorId).charAt(0)}</AvatarFallback></Avatar>
                        <div>
                            <p className="font-semibold">{contractorLabel(row.contractorId)}</p>
                            {rating != null && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{rating.toFixed(1)}</span>
                                    <span>({reviews ?? 0} reviews)</span>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        },
        {
            key: 'finalScore',
            header: 'Match Score',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Progress value={row.matchScore?.finalScore} className="w-24" />
                    <span className="font-semibold">{row.matchScore?.finalScore}%</span>
                    {getTopMatchBadge(row.matchScore?.rankingPosition)}
                </div>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (row) => (
                <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm">View Profile</Button>
                    <Button size="sm" onClick={() => handleAccept(contractorLabel(row.contractorId))}>Select Contractor</Button>
                </div>
            )
        }
    ];

    return (
        <DataTable
            columns={columns}
            data={applications}
            isLoading={false}
            query={query}
            setQuery={setQuery}
            totalCount={applications.length}
            totalPages={Math.ceil(applications.length / query.limit)}
            onSelectionChange={() => { }}
            selectedRows={{}}
        />
    )
}
