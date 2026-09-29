'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, Users, BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { UserRole } from "@/lib/types";

interface EducationData {
  institutions: { name: string; type: string; location: string; students: number; pain_points: string[] }[];
  dashboard_stats: {
    total_institutions: number;
    total_students: number;
    pending_exams: number;
    suspicious_activity_flags: number;
  };
  alerts: string[];
}

interface EducationDashboardProps {
    data: EducationData;
}

const getRoleCategoryVariant = (roleCategory: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'purple' => {
    switch (roleCategory) {
        case 'University': return 'secondary';
        case 'Online Learning': return 'purple';
        case 'Bootcamp': return 'warning';
        case 'College': return 'default';
        case 'Government': return 'outline';
        default: return 'outline';
    }
}

export function EducationDashboard({ data }: EducationDashboardProps) {

    return (
        <div className="space-y-8 mt-8">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Institutions</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.dashboard_stats.total_institutions}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.dashboard_stats.total_students.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Exams</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.dashboard_stats.pending_exams}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.dashboard_stats.suspicious_activity_flags}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                     <Card>
                        <CardHeader>
                            <CardTitle>Educational Institutions</CardTitle>
                            <CardDescription>Overview of different types of institutions and their key challenges.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Institution</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Students</TableHead>
                                        <TableHead>Key Pain Points</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.institutions.map(inst => (
                                    <TableRow key={inst.name}>
                                        <TableCell className="font-medium">{inst.name}<br/><span className="text-xs text-muted-foreground">{inst.location}</span></TableCell>
                                        <TableCell><Badge variant={getRoleCategoryVariant(inst.type)}>{inst.type}</Badge></TableCell>
                                        <TableCell>{inst.students.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {inst.pain_points.map(p => <Badge key={p} variant="outline">{p}</Badge>)}
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
                            <p><span className="font-bold text-green-600">GET</span> /api/educational_institutions</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
