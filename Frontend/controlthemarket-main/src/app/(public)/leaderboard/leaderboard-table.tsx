
'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PublicCandidateRanking } from './page';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { badges as mockBadges } from '@/lib/badges';
import { Trophy, ShieldCheck, Rocket, Award, BrainCircuit } from 'lucide-react';

const badgeIcons: { [key: string]: React.ElementType } = {
  Trophy, ShieldCheck, Rocket, Award, BrainCircuit
};

export function LeaderboardTable({ data }: { data: PublicCandidateRanking[] }) {
    if (data.length === 0) {
        return (
             <div className="text-center py-16">
                <h3 className="text-xl font-semibold">No Other Candidates Found</h3>
                <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Rank</TableHead>
                        <TableHead>Candidate</TableHead>
                        <TableHead className="hidden md:table-cell">Primary Role</TableHead>
                        <TableHead className="hidden md:table-cell">Badges</TableHead>
                        <TableHead>Tasks Completed</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map(item => (
                        <TableRow key={item.candidate.id}>
                            <TableCell className="font-bold text-lg text-muted-foreground">{item.rank}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={item.candidate.profile?.avatarUrl} />
                                        <AvatarFallback>{item.candidate.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{item.candidate.name}</span>
                                </div>
                            </TableCell>
                             <TableCell className="hidden md:table-cell">
                                {item.primaryRole ? <Badge variant="secondary">{item.primaryRole}</Badge> : '-'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                <div className="flex items-center gap-1.5">
                                    {item.candidate.profile?.badgeIds?.slice(0, 4).map(badgeId => {
                                        const badge = mockBadges.find(b => b.id === badgeId);
                                        if (!badge) return null;
                                        const Icon = badgeIcons[badge.icon];
                                        return (
                                            <TooltipProvider key={badge.id}>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Icon className="h-5 w-5 text-muted-foreground hover:text-primary" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="font-semibold">{badge.name}</p>
                                                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )
                                    })}
                                </div>
                            </TableCell>
                            <TableCell>{item.tasksCompleted}</TableCell>
                            <TableCell className="font-semibold">{item.aggregatedScore}</TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="ghost" size="sm">
                                    <Link href={`/candidate/${item.candidate.id}`}>View Profile</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
