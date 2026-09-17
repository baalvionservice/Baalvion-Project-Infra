
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, Users, BookOpen } from "lucide-react";

interface GovernmentData {
  programs: { name: string; type: string; location: string; candidates: number; pain_points: string[] }[];
  dashboard_stats: {
    total_programs: number;
    total_candidates: number;
    pending_assessments: number;
    compliance_flags: number;
  };
  alerts: string[];
}

interface GovernmentDashboardProps {
    data: GovernmentData;
}

const getTypeVariant = (type: string): 'default' | 'secondary' => {
    return type === 'National' ? 'default' : 'secondary';
};

export function GovernmentDashboard({ data }: GovernmentDashboardProps) {
    return (
        <div className="space-y-8 mt-8">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.dashboard_stats.total_programs}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.dashboard_stats.total_candidates.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Assessments</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.dashboard_stats.pending_assessments.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Compliance Flags</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.dashboard_stats.compliance_flags}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                     <Card>
                        <CardHeader>
                            <CardTitle>Skill Development Programs</CardTitle>
                            <CardDescription>Overview of different programs and their key challenges.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Program Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Candidates</TableHead>
                                        <TableHead>Key Pain Points</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.programs.map(prog => (
                                    <TableRow key={prog.name}>
                                        <TableCell className="font-medium">{prog.name}<br/><span className="text-xs text-muted-foreground">{prog.location}</span></TableCell>
                                        <TableCell><Badge variant={getTypeVariant(prog.type)}>{prog.type}</Badge></TableCell>
                                        <TableCell>{prog.candidates.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {prog.pain_points.map(p => <Badge key={p} variant="outline">{p}</Badge>)}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                 <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Alerts & Notifications</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.alerts.map((alertMsg, index) => (
                                <div key={index} className="flex items-start gap-3 rounded-md border p-3">
                                    <Bell className="h-5 w-5 text-warning mt-1" />
                                    <p className="text-sm text-muted-foreground">{alertMsg}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Mock API Endpoint</CardTitle>
                            <CardDescription>This dashboard is powered by the following API endpoint.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs font-mono bg-muted p-4 rounded-md">
                            <p><span className="font-bold text-green-600">GET</span> /api/government_programs</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
