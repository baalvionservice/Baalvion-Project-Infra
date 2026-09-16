
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { Cpu, AlertTriangle, Timer, ShieldCheck, Activity, HeartPulse, RefreshCw, Loader2 } from "lucide-react";
import type { SystemMetric, ServiceStatus, SystemError } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { getSystemMetrics, getSystemErrors, getServiceStatus } from "@/lib/api";


export type HealthStatus = 'Healthy' | 'Warning' | 'Critical';
export type HealthAlert = {
    id: string;
    severity: 'High' | 'Medium' | 'Low';
    title: string;
    timestamp: string;
    source: string;
};

// Sub-components
function HealthScoreCard({ score, status, alertCount }: { score: number, status: HealthStatus, alertCount: number }) {
    const getStatusColor = () => {
        switch(status) {
            case 'Healthy': return 'text-green-500';
            case 'Warning': return 'text-yellow-500';
            case 'Critical': return 'text-red-500';
        }
    };

    const circumference = 2 * Math.PI * 60; // 2 * pi * radius
    const offset = circumference - (score / 100) * circumference;

    return (
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Overall Health Score</CardTitle>
                <CardDescription>A composite score of system stability.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4">
                 <div className="relative h-40 w-40">
                    <svg className="h-full w-full" viewBox="0 0 140 140">
                    <circle
                        className="text-muted/20"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r="60"
                        cx="70"
                        cy="70"
                    />
                    <circle
                        className={getStatusColor()}
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="60"
                        cx="70"
                        cy="70"
                        transform="rotate(-90 70 70)"
                    />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className={`text-4xl font-bold ${getStatusColor()}`}>
                        {score}
                        </span>
                    </div>
                </div>
                <Badge variant={status === 'Healthy' ? 'default' : status === 'Warning' ? 'warning' : 'destructive'} className="text-lg">
                    {status}
                </Badge>
                <p className="text-sm text-muted-foreground">{alertCount} active alert(s)</p>
            </CardContent>
        </Card>
    );
}

function HealthMetricsPanel({ latestMetric, services }: { latestMetric: SystemMetric, services: ServiceStatus[] }) {
    const overallUptime = (services.reduce((acc, s) => acc + (s.uptimePercentage || 100), 0) / services.length).toFixed(3);

    const getStatusColor = (value: number, thresholds: { warn: number, crit: number }) => {
        if (value > thresholds.crit) return "text-red-500";
        if (value > thresholds.warn) return "text-yellow-500";
        return "text-green-500";
    }

    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Key Health Indicators</CardTitle>
                <CardDescription>A real-time snapshot of core system metrics.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2"><Cpu className="h-4 w-4"/>System Load</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className={cn("text-2xl font-bold", getStatusColor(latestMetric.systemLoad, { warn: 75, crit: 90 }))}>{latestMetric.systemLoad.toFixed(1)}%</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2"><AlertTriangle className="h-4 w-4"/>Error Rate</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className={cn("text-2xl font-bold", getStatusColor(latestMetric.errorRate, { warn: 2, crit: 5 }))}>{latestMetric.errorRate.toFixed(2)}%</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2"><Timer className="h-4 w-4"/>API Response</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className={cn("text-2xl font-bold", getStatusColor(latestMetric.avgApiResponseTime, { warn: 200, crit: 500 }))}>{latestMetric.avgApiResponseTime}ms</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2"><ShieldCheck className="h-4 w-4"/>Uptime (90d)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className={cn("text-2xl font-bold", getStatusColor(parseFloat(overallUptime) * -1, { warn: -99.9, crit: -99 }))}>{overallUptime}%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2"><Activity className="h-4 w-4"/>API RPS</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{latestMetric.requestsPerSecond}</p>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    );
}

function AlertSummaryPanel({ alerts }: { alerts: HealthAlert[] }) {
    const getSeverityVariant = (severity: HealthAlert['severity']) => {
        switch(severity) {
            case 'High': return 'destructive';
            case 'Medium': return 'warning';
            case 'Low': return 'secondary';
        }
    };
    return (
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Active System Alerts</CardTitle>
                <CardDescription>A summary of ongoing issues affecting platform health.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Severity</TableHead>
                                <TableHead>Alert</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead className="text-right">Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {alerts.length > 0 ? alerts.slice(0, 5).map((alert) => (
                                <TableRow key={alert.id}>
                                    <TableCell><Badge variant={getSeverityVariant(alert.severity)}>{alert.severity}</Badge></TableCell>
                                    <TableCell className="font-medium">{alert.title}</TableCell>
                                    <TableCell>{alert.source}</TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No active alerts. The system is healthy.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}


// Mock calculation logic for system health
const calculateSystemHealth = (
    metrics: SystemMetric[], 
    errors: SystemError[], 
    services: ServiceStatus[]
): { score: number, status: HealthStatus, alerts: HealthAlert[] } => {
    if (metrics.length === 0) {
        return { score: 0, status: 'Critical', alerts: [] };
    }

    let score = 100;
    const alerts: HealthAlert[] = [];
    const latestMetric = metrics[metrics.length - 1];

    // Deduct for high system load
    if (latestMetric.systemLoad > 90) {
        score -= 25;
        alerts.push({ id: 'alert-load-crit', severity: 'High', title: 'System load is critical', timestamp: latestMetric.timestamp, source: 'System Metrics' });
    } else if (latestMetric.systemLoad > 75) {
        score -= 10;
        alerts.push({ id: 'alert-load-warn', severity: 'Medium', title: 'System load is high', timestamp: latestMetric.timestamp, source: 'System Metrics' });
    }

    // Deduct for high error rate
    if (latestMetric.errorRate > 5) {
        score -= 20;
        alerts.push({ id: 'alert-error-crit', severity: 'High', title: 'High API error rate', timestamp: latestMetric.timestamp, source: 'System Metrics' });
    } else if (latestMetric.errorRate > 2) {
        score -= 5;
    }

    // Deduct for slow response times
    if (latestMetric.avgApiResponseTime > 500) {
        score -= 15;
        alerts.push({ id: 'alert-response-med', severity: 'Medium', title: 'Slow API response times', timestamp: latestMetric.timestamp, source: 'System Metrics' });
    } else if (latestMetric.avgApiResponseTime > 200) {
        score -= 5;
    }
    
    // Deduct for open critical errors
    const criticalErrors = errors.filter(e => e.status === 'Open' && e.severity === 'Critical');
    if (criticalErrors.length > 0) {
        score -= criticalErrors.length * 10;
        criticalErrors.forEach(err => {
            alerts.push({ id: `alert-err-${err.id}`, severity: 'High', title: err.type, timestamp: err.lastOccurred, source: err.service });
        });
    }

    // Deduct for degraded or down services
    services.forEach(service => {
        if (service.status === 'Down') {
            score -= 30;
            alerts.push({ id: `alert-svc-down-${service.id}`, severity: 'High', title: `${service.name} is down`, timestamp: service.lastChecked, source: 'Service Status' });
        } else if (service.status === 'Degraded') {
            score -= 15;
            alerts.push({ id: `alert-svc-degraded-${service.id}`, severity: 'Medium', title: `${service.name} is degraded`, timestamp: service.lastChecked, source: 'Service Status' });
        }
    });
    
    score = Math.max(0, Math.round(score));

    let status: HealthStatus;
    if (score >= 90) {
        status = 'Healthy';
    } else if (score >= 60) {
        status = 'Warning';
    } else {
        status = 'Critical';
    }

    return { score, status, alerts: alerts.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) };
}

export default function SystemHealthPage() {
    const [loading, setLoading] = useState(true);
    const [healthData, setHealthData] = useState<{ score: number, status: HealthStatus, alerts: HealthAlert[], latestMetric: SystemMetric | null, services: ServiceStatus[] } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        const [metrics, errors, services] = await Promise.all([
            getSystemMetrics(),
            getSystemErrors(),
            getServiceStatus(),
        ]);
        const { score, status, alerts } = calculateSystemHealth(metrics, errors, services);
        setHealthData({
            score,
            status,
            alerts,
            latestMetric: metrics[metrics.length - 1],
            services,
        });
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading || !healthData || !healthData.latestMetric) {
        return (
            <div className="flex h-full w-full items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                        <HeartPulse className="h-8 w-8" />
                        System Health
                    </h2>
                    <p className="text-muted-foreground">
                        A real-time summary of platform stability and performance.
                    </p>
                </div>
                <Button variant="outline" onClick={fetchData}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <HealthScoreCard score={healthData.score} status={healthData.status} alertCount={healthData.alerts.length} />
                <HealthMetricsPanel latestMetric={healthData.latestMetric} services={healthData.services} />
                <AlertSummaryPanel alerts={healthData.alerts} />
            </div>
        </div>
    );
}
