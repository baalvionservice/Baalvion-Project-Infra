
'use client';
import BusinessRankingTable from './components/business-ranking-table';
import ComparisonCharts from './components/comparison-charts';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function BusinessAnalyticsPage() {
    const [isNewUser, setIsNewUser] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const isDemo = localStorage.getItem('baalvion_demo_mode') === 'true';
        const setupComplete = localStorage.getItem('setup_complete') === 'true';
        if (!isDemo && !setupComplete) {
        setIsNewUser(true);
        // Animate progress bar
        const timer = setTimeout(() => setProgress(100/7), 500);
        return () => clearTimeout(timer);
        }
    }, []);

    if (isNewUser) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Business Analytics</h1>
                    <p className="text-muted-foreground">
                    Rank and compare the performance of your business units.
                    </p>
                </div>
                <Card className="flex items-center justify-center p-8 lg:p-16">
                        <div className="text-center max-w-md">
                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-muted rounded-full">
                                    <BarChart2 className="w-12 h-12 text-primary" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Generating Your First Analytics Report</h2>
                            <p className="mt-2 text-muted-foreground">Analytics and insights will appear after your account has been active for 7 days. We need to collect enough data to provide meaningful analysis.</p>
                            <div className="mt-6">
                                <Progress value={progress} className="w-full" />
                                <p className="text-sm text-muted-foreground mt-2">1 of 7 days completed</p>
                            </div>
                        </div>
                    </Card>
            </div>
        );
    }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Analytics</h1>
        <p className="text-muted-foreground">
          Rank and compare the performance of your business units.
        </p>
      </div>

      <BusinessRankingTable />
      
      <ComparisonCharts />

    </div>
  );
}
