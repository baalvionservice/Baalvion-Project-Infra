
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, X, ChevronDown } from 'lucide-react';
import forecastData from '@/lib/data/forecast.json';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';


const categoryColors: Record<string, string> = {
  Revenue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300',
  Cost: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300',
  Expansion: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-300',
  Risk: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300',
  Efficiency: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300',
};

const recommendationDetails: Record<string, { title: string, steps: string[] }> = {
    rec_1: {
        title: 'Implementation Plan: New SaaS Tier',
        steps: [
            "Conduct user survey to validate demand for 'Pro' features.",
            "Define feature set for the new 'Pro' pricing tier.",
            "Develop and test the new features.",
            "Update pricing page and billing integration.",
            "Launch an email campaign to existing users about the new tier."
        ]
    },
    rec_2: {
        title: 'Action Plan: Server Consolidation',
        steps: [
            "Benchmark current server performance and cost.",
            "Design a new architecture using a scalable cloud provider (e.g., AWS EC2 Auto Scaling).",
            "Plan and execute a phased migration to the new infrastructure.",
            "Monitor performance and cost post-migration.",
            "Decommission old dedicated servers."
        ]
    },
    rec_3: {
        title: 'Strategy: Australian Market Entry',
        steps: [
            "Conduct market research on Australian fintech landscape and competitors.",
            "Adapt marketing materials for the Australian audience.",
            "Launch a targeted digital ad campaign on LinkedIn and Google Ads.",
            "Partner with local financial influencers.",
            "Establish a local customer support channel."
        ]
    },
    rec_4: {
        title: 'Urgent Fix: Customer Churn',
        steps: [
            "Analyze user feedback and bug reports related to the latest update.",
            "Prioritize and fix critical bugs causing user friction.",
            "Release a patch update as soon as possible.",
            "Communicate with affected users about the fix.",
            "Offer a small credit to users who reported the issue."
        ]
    },
    rec_5: {
        title: 'Process Improvement: Invoice Automation',
        steps: [
            "Evaluate and select an automated invoicing software (e.g., Zoho Invoice, FreshBooks).",
            "Integrate the software with existing accounting systems.",
            "Train finance team on the new automated workflow.",
            "Run the new system in parallel with the manual process for one cycle.",
            "Fully transition to the automated system."
        ]
    }
};

export default function AiRecommendations() {
  const [recommendations, setRecommendations] = useState(forecastData.aiRecommendations);
  const [expandedRecId, setExpandedRecId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDismiss = (recId: string) => {
    setRecommendations(recommendations.filter(r => r.id !== recId));
    toast({
        title: "Recommendation Dismissed",
        description: "The insight has been archived."
    });
  }

  const handleExplore = (recId: string) => {
    setExpandedRecId(expandedRecId === recId ? null : recId);
  }

  return (
    <section>
        <h2 className="text-2xl font-bold tracking-tight mb-4">AI Recommendations</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {recommendations.map((rec) => {
                const isExpanded = expandedRecId === rec.id;
                const details = recommendationDetails[rec.id as keyof typeof recommendationDetails];
                return (
                    <Card key={rec.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                 <Badge className={cn(categoryColors[rec.category] || '')}>{rec.category}</Badge>
                                 <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Zap className="h-4 w-4 text-yellow-500" />
                                    <span>{rec.confidence}% Confidence</span>
                                </div>
                            </div>
                            <CardTitle className="pt-2">{rec.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground">{rec.description}</p>
                            {isExpanded && details && (
                                <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                                    <h4 className="font-semibold mb-2">{details.title}</h4>
                                    <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                                        {details.steps.map((step, index) => <li key={index}>{step}</li>)}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex-col items-start gap-4">
                             <div>
                                <p className="text-xs text-muted-foreground">Potential Impact</p>
                                <p className="font-bold text-green-600">{rec.impact}</p>
                            </div>
                            <div className="flex w-full gap-2">
                                <Button className="flex-1" onClick={() => handleExplore(rec.id)}>
                                    <ChevronDown className={cn("mr-2 h-4 w-4 transition-transform", isExpanded && "rotate-180")}/> {isExpanded ? 'Hide Details' : 'Explore'}
                                </Button>
                                <Button variant="outline" onClick={() => handleDismiss(rec.id)}><X className="mr-2 h-4 w-4"/> Dismiss</Button>
                            </div>
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    </section>
  );
}
