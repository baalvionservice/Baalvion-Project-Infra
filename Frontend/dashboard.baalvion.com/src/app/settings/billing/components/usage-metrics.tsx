
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Users, Building, Cpu, HardDrive } from 'lucide-react';

interface Usage {
    used: number;
    limit: number;
}

interface UsageBarProps {
    label: string;
    used: number;
    limit: number;
    icon: React.ElementType;
}

interface UsageMetricsProps {
    usage: {
        businesses: Usage;
        users: Usage;
        apiCalls: Usage;
        storage: Usage;
    };
}


const UsageBar = ({ label, used, limit, icon: Icon }: UsageBarProps) => {
    const percentage = (used / limit) * 100;
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
                <Icon className="h-4 w-4 text-muted-foreground"/>
                <span>{label}</span>
            </div>
            <Progress value={percentage} className={cn('h-2', percentage > 90 ? '[&>div]:bg-red-500' : '')} />
            <p className="text-xs text-muted-foreground">{used.toLocaleString()} / {limit.toLocaleString()} ({percentage.toFixed(0)}%)</p>
        </div>
    )
}

export default function UsageMetrics({ usage }: UsageMetricsProps) {
    return (
        <Card className="sticky top-20">
            <CardHeader>
                <CardTitle>Current Usage</CardTitle>
                <CardDescription>Your usage for the current billing cycle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <UsageBar label="Businesses" used={usage.businesses.used} limit={usage.businesses.limit} icon={Building} />
                <UsageBar label="Users" used={usage.users.used} limit={usage.users.limit} icon={Users} />
                <UsageBar label="API Calls" used={usage.apiCalls.used} limit={usage.apiCalls.limit} icon={Cpu} />
                <UsageBar label="Storage" used={usage.storage.used} limit={usage.storage.limit} icon={HardDrive} />
            </CardContent>
        </Card>
    );
}
