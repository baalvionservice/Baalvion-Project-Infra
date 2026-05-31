
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Medal, Trophy, ShieldCheck, Rocket, Award, BrainCircuit } from "lucide-react";
import type { PublicCandidateRanking } from "./page";
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { badges as mockBadges } from '@/lib/badges';


const rankIcons = [
    { icon: Crown, color: "text-yellow-500", shadow: "shadow-yellow-500/50" },
    { icon: Medal, color: "text-gray-400", shadow: "shadow-gray-400/50" },
    { icon: Trophy, color: "text-orange-500", shadow: "shadow-orange-500/50" }
];

const badgeIcons: { [key: string]: React.ElementType } = {
  Trophy, ShieldCheck, Rocket, Award, BrainCircuit
};

export function LeaderboardTopPerformers({ performers }: { performers: PublicCandidateRanking[] }) {
    if (performers.length === 0) {
        return null;
    }
    
    const getRankedPerformer = (rank: number) => performers.find(p => p.rank === rank);
    const performer1 = getRankedPerformer(1);
    const performer2 = getRankedPerformer(2);
    const performer3 = getRankedPerformer(3);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 items-end">
            {/* Rank 2 */}
            <div className="order-2 md:order-1">
                {performer2 && <PerformerCard performer={performer2} rank={2} />}
            </div>
            
            {/* Rank 1 */}
            <div className="order-1 md:order-2">
                {performer1 && <PerformerCard performer={performer1} rank={1} />}
            </div>

            {/* Rank 3 */}
            <div className="order-3">
                {performer3 && <PerformerCard performer={performer3} rank={3} />}
            </div>
        </div>
    );
}

function PerformerCard({ performer, rank }: { performer: PublicCandidateRanking; rank: number }) {
    const rankInfo = rankIcons[rank-1];
    const Icon = rankInfo.icon;

    return (
        <Card className={`relative transition-transform duration-300 ${rank === 1 ? 'scale-105 shadow-2xl' : 'hover:scale-105'}`}>
            <CardHeader className="items-center text-center pt-8">
                 <div className={`relative mb-2 ${rankInfo.shadow}`}>
                    <Icon className={`h-10 w-10 ${rankInfo.color}`} />
                </div>
                 <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={performer.candidate.profile?.avatarUrl} />
                    <AvatarFallback>{performer.candidate.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle>{performer.candidate.name}</CardTitle>
                <CardDescription>Rank #{performer.rank}</CardDescription>
            </CardHeader>
             <CardContent className="text-center space-y-4">
                 <p className="text-4xl font-bold">{performer.aggregatedScore}<span className="text-xl text-muted-foreground">/100</span></p>
                <div className="flex flex-wrap justify-center gap-2">
                    {performer.primaryRole && <Badge variant="secondary">{performer.primaryRole}</Badge>}
                    {performer.candidate.profile?.experienceLevel && <Badge variant="outline">{performer.candidate.profile.experienceLevel}</Badge>}
                </div>
                 <div className="flex justify-center gap-3 pt-2">
                    {performer.candidate.profile?.badgeIds?.slice(0, 3).map(badgeId => {
                        const badge = mockBadges.find(b => b.id === badgeId);
                        if (!badge) return null;
                        const Icon = badgeIcons[badge.icon];
                        return (
                            <TooltipProvider key={badge.id}>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Icon className="h-6 w-6 text-muted-foreground hover:text-primary" />
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
                <Button variant="outline" asChild className="w-full">
                    <Link href={`/candidate/${performer.candidate.id}`}>View Profile</Link>
                </Button>
            </CardContent>
        </Card>
    )
}
