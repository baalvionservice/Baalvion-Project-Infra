'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { CandidateRanking } from './page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Trophy, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

function RankingTable({ data, currentUserId }: { data: CandidateRanking[], currentUserId: string | null }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>See where you stand among your peers.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Rank</TableHead>
                            <TableHead>Candidate</TableHead>
                            <TableHead>Tasks Completed</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map(item => (
                            <TableRow key={item.candidate.id} className={cn(item.candidate.id === currentUserId && 'bg-accent')}>
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
                                <TableCell>{item.tasksCompleted}</TableCell>
                                <TableCell className="text-right font-semibold text-lg">{item.aggregatedScore}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}


export function CandidateRankingClientPage({ initialData }: { initialData: CandidateRanking[] }) {
    const { user } = useAuth();
    
    const currentUserRanking = useMemo(() => {
        if (!user) return null;
        return initialData.find(item => item.candidate.id === user.id);
    }, [initialData, user]);

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="font-headline text-3xl font-bold tracking-tight">
                    My Rankings
                </h2>
            </div>
            
            {currentUserRanking && (
                <Card className="bg-primary text-primary-foreground">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-6 w-6" />
                            Your Performance Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="rounded-md bg-primary/80 p-4">
                            <p className="text-sm font-medium opacity-80">Your Rank</p>
                            <p className="text-4xl font-bold">#{currentUserRanking.rank}</p>
                        </div>
                        <div className="rounded-md bg-primary/80 p-4">
                            <p className="text-sm font-medium opacity-80">Your Score</p>
                            <p className="text-4xl font-bold">{currentUserRanking.aggregatedScore}</p>
                        </div>
                        <div className="rounded-md bg-primary/80 p-4">
                            <p className="text-sm font-medium opacity-80">Tasks Completed</p>
                            <p className="text-4xl font-bold">{currentUserRanking.tasksCompleted}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <RankingTable data={initialData} currentUserId={user?.id || null} />
        </div>
    );
}
