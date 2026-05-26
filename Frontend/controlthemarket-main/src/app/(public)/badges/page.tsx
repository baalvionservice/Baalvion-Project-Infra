
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge as UiBadge } from '@/components/ui/badge';
import { mockBadges }from '@/lib/mock-data';
import type { Badge } from '@/lib/types';
import { Trophy, ShieldCheck, Rocket, Award, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

const badgeIcons: { [key: string]: React.ElementType } = {
  Trophy, ShieldCheck, Rocket, Award, BrainCircuit
};

export default function BadgesPage() {

    const getRarityVariant = (rarity: Badge['rarity']) => {
        switch(rarity) {
            case 'Elite': return 'destructive';
            case 'Rare': return 'purple';
            case 'Common': return 'secondary';
        }
    }

    return (
        <div className="container py-12 md:py-20">
            <div className="mx-auto max-w-3xl text-center">
                <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
                    Platform Badges
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Discover the badges you can earn to prove your skills and build credibility.
                </p>
            </div>
            
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {mockBadges.map(badge => {
                    const Icon = badgeIcons[badge.icon];
                    return (
                        <Card key={badge.id}>
                            <CardHeader className="items-center text-center">
                                <Icon className="h-12 w-12 text-primary mb-2" />
                                <CardTitle>{badge.name}</CardTitle>
                                <UiBadge variant={getRarityVariant(badge.rarity)}>{badge.rarity}</UiBadge>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-muted-foreground">{badge.description}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}
