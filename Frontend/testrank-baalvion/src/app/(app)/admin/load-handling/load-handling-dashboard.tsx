
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Users, Zap, Server, Activity, ArrowDown, ArrowUp, RefreshCw, BarChart, Settings } from "lucide-react";
import type { SystemMetric, ServiceLoad, ScalingEvent, AutoScalingStatus } from "@/lib/types";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";

interface LoadHandlingDashboardProps {
    latestMetric: SystemMetric;
    serviceLoad: ServiceLoad[];
    scalingEvents: ScalingEvent[];
}

const getStatusVariant = (status: AutoScalingStatus): 'default' | 'warning' | 'purple' => {
    switch (status) {
        case 'Scaling Up': return 'purple';
        case 'Scaling Down': return 'warning';
        default: return 'default';
    }
};

const getLoadColor = (load: number) => {
    if (load > 90) return "text-destructive";
    if (load > 75) return "text-yellow-500";
    return "text-green-500";
}

export function LoadHandlingDashboard({ latestMetric, serviceLoad, scalingEvents }: LoadHandlingDashboardProps) {

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{latestMetric.activeUsers}</div>
                </CardContent>
                </Card>
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Requests per Second</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{latestMetric.requestsPerSecond}</div>
                </CardContent>
                </Card>
                 <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Load</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${getLoadColor(latestMetric.systemLoad)}`}>{latestMetric.systemLoad.toFixed(1)}%</div>
                </CardContent>
                </Card>
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Auto-Scaling Status</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Badge variant={getStatusVariant(latestMetric.autoScalingStatus)}>{latestMetric.autoScalingStatus}</Badge>
                </CardContent>
                </Card>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Load Distribution Panel</CardTitle>
                        <CardDescription>Mock load distribution across different system services.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Load</TableHead>
                                    <TableHead className="text-right">Requests Handled</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {serviceLoad.map(service => (
                                    <TableRow key={service.id}>
                                        <TableCell className="font-medium">{service.name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Progress value={service.loadPercentage} className="w-32 h-2" indicatorClassName={service.loadPercentage > 90 ? "bg-destructive" : service.loadPercentage > 75 ? "bg-yellow-500" : "bg-primary"} />
                                                <span className={`font-semibold ${getLoadColor(service.loadPercentage)}`}>{service.loadPercentage}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">{service.requestsHandled.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Scaling Simulation Panel</CardTitle>
                        <CardDescription>Simulated scaling events based on load.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-md border p-4 space-y-3">
                            <h4 className="font-medium text-sm">Recent Scaling Events</h4>
                             {scalingEvents.map(event => (
                                <div key={event.id} className="flex items-center gap-3">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${event.change === 'up' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                        {event.change === 'up' ? <ArrowUp className="h-4 w-4 text-green-500"/> : <ArrowDown className="h-4 w-4 text-red-500"/>}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Scaled {event.change} to {event.instanceCount} instances</p>
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })} - {event.reason}</p>
                                    </div>
                                </div>
                             ))}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button variant="outline"><BarChart className="mr-2 h-4 w-4" /> Simulate Traffic Spike</Button>
                             <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Configure Thresholds</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
