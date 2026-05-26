
'use client';
import { Card, CardContent } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Wand2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import aiPredictionsData from '@/lib/data/ai-predictions.json';


export default function PredictionsHeader() {
    const score = aiPredictionsData.confidenceScore;
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setProgress(score), 150);
        return () => clearTimeout(timer);
    }, [score]);

    return (
        <Card className="bg-gradient-to-r from-primary/80 to-primary text-primary-foreground">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                     <Wand2 className="h-10 w-10" />
                     <div>
                        <h1 className="text-2xl font-bold tracking-tight">Baalvion AI</h1>
                        <p className="opacity-80">Powered by 3 years of your business data</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20">
                        <CircularProgress value={progress} strokeWidth={6} className="text-white" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold">{score}%</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg">Overall AI</p>
                        <p className="font-bold text-lg -mt-1">Confidence Score</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
