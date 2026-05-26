
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import type { User } from '@/lib/types';

interface TopCandidate {
    candidate: User;
    score: number;
}

export function TopCandidates({ candidates }: { candidates: TopCandidate[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Top Candidates</CardTitle>
                <CardDescription>
                    Highest-scoring candidates from your company's tasks.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Candidate</TableHead>
                            <TableHead className="text-right">Avg. Score</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {candidates.length > 0 ? candidates.map(({ candidate, score }) => (
                            <TableRow key={candidate.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={candidate.profile?.avatarUrl} alt={candidate.name} />
                                            <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{candidate.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-bold text-lg text-primary">{score}</TableCell>
                            </TableRow>
                        )) : (
                             <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center">
                                    No evaluated candidates yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
