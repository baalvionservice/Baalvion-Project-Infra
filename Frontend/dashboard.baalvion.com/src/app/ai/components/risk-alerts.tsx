'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAi } from '@/hooks/use-ai';
import { cn } from '@/lib/utils';

export default function RiskAlerts() {
    const { predictions } = useAi();
    const alerts = predictions.riskAlerts;
    return (
        <Card>
            <CardHeader>
                 <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-red-500" /> Risk Alerts</CardTitle>
                 <CardDescription>Potential risks identified by AI analysis that may require attention.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {alerts.map(alert => (
                    <Card key={alert.id} className={cn(alert.level === 'HIGH' ? 'border-red-500' : 'border-orange-500')}>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-base">{alert.business}</CardTitle>
                                <Badge variant="destructive" className={cn(alert.level === 'HIGH' ? 'bg-red-500' : 'bg-orange-500')}>{alert.level}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">{alert.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </CardContent>
        </Card>
    );
}
