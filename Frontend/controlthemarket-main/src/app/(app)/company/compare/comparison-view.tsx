
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ComparisonData } from './page';

const evaluationCriteria = [
    'Proficiency', 'Best Practices', 'Clarity', 'Documentation',
    'Analysis', 'Solution Quality', 'Innovation', 'Polish & Initiative',
    'Collaboration', 'Proactiveness'
];


export function ComparisonView({ data }: { data: ComparisonData[] }) {
    if (data.length === 0) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                 <h2 className="font-headline text-3xl font-bold tracking-tight">
                    Candidate Comparison
                </h2>
                <p className="text-muted-foreground">
                    No candidates selected for comparison. Please select two or more candidates from the evaluations dashboard.
                </p>
            </div>
        );
    }

    const findHighestScore = (criterion: string) => {
        let maxScore = -1;
        data.forEach(d => {
            const score = d.evaluation?.criteriaScores?.[criterion];
            if (score !== undefined && score > maxScore) {
                maxScore = score;
            }
        });
        return maxScore;
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <h2 className="font-headline text-3xl font-bold tracking-tight">
                Candidate Comparison
            </h2>
            
            <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
                {data.map(({ candidate, evaluation }) => (
                    <Card key={candidate.id}>
                        <CardHeader className="items-center text-center">
                             <Avatar className="h-16 w-16 mb-2">
                                <AvatarImage src={candidate.profile?.avatarUrl} alt={candidate.name} />
                                <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <CardTitle className="text-lg">{candidate.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-4xl font-bold">{evaluation?.score || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">Overall Score</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Score Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-bold min-w-[150px]">Criterion</TableHead>
                                    {data.map(({ candidate }) => (
                                        <TableHead key={candidate.id} className="text-center font-bold min-w-[150px]">{candidate.name}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {evaluationCriteria.map(criterion => {
                                    const maxScore = findHighestScore(criterion);
                                    return (
                                        <TableRow key={criterion}>
                                            <TableCell className="font-medium">{criterion}</TableCell>
                                            {data.map(({ candidate, evaluation }) => {
                                                const score = evaluation?.criteriaScores?.[criterion];
                                                const isHighest = score === maxScore && score !== undefined && maxScore > -1;
                                                return (
                                                    <TableCell key={candidate.id} className="text-center">
                                                        {score !== undefined ? (
                                                            <Badge variant={isHighest ? 'default' : 'secondary'} className={cn('text-base', isHighest && 'font-bold text-lg')}>
                                                                {score}/10
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground">N/A</span>
                                                        )}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    );
                                })}
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-bold">Overall Score</TableHead>
                                    {data.map(({ candidate, evaluation }) => (
                                        <TableHead key={candidate.id} className="text-center font-bold text-lg text-primary">
                                            {evaluation?.score ?? 'N/A'}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
