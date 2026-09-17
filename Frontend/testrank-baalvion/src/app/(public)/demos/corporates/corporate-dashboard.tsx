'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Bell, Users, Briefcase, Video, PlayCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface ValuePropositionData {
    live_assessments: { id: string; candidate: string; task: string; status: string; video_url: string; }[];
    dashboard_stats: {
        open_positions: number;
        pending_assessments: number;
        top_skills: { [key: string]: number };
        candidate_rankings: { name: string; score: number }[];
    };
    alerts: string[];
    chartData: {
        assessmentResults: { name: string; value: number }[];
        topSkills: { name: string; value: number }[];
        candidateActivity: { name: string; value: number }[];
    }
}

interface CorporateDashboardProps {
    data: ValuePropositionData;
}

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'warning' => {
    switch (status) {
        case 'Verified': return 'default';
        case 'Completed': return 'secondary';
        case 'In Progress': return 'warning';
        default: return 'destructive';
    }
};

export function CorporateDashboard({ data }: CorporateDashboardProps) {
    const COLORS: { [key: string]: string } = {
        'Verified': '#00C49F',
        'Completed': '#0088FE',
        'In Progress': '#FFBB28',
        'Pending': '#FF8042',
    };

    return (
        <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.dashboard_stats.open_positions}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Assessments</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.dashboard_stats.pending_assessments}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Ranked Candidate</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{data.dashboard_stats.candidate_rankings[1]?.name || 'N/A'}</div>
                         <p className="text-xs text-muted-foreground">Score: {data.dashboard_stats.candidate_rankings[1]?.score || 'N/A'}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Live Proof-of-Skill Assessments</CardTitle>
                            <CardDescription>Monitor candidate assessments in real-time. Includes video recording for review.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Candidate</TableHead>
                                        <TableHead>Task</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.live_assessments.map(assessment => (
                                    <TableRow key={assessment.id}>
                                        <TableCell className="font-medium">{assessment.candidate}</TableCell>
                                        <TableCell>{assessment.task}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(assessment.status)}>{assessment.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <a href={assessment.video_url} target="_blank" rel="noopener noreferrer">
                                                    <PlayCircle className="mr-2 h-4 w-4" /> Watch Recording
                                                </a>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Assessment Results</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={data.chartData.assessmentResults} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                            {data.chartData.assessmentResults.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Top Required Skills</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={data.chartData.topSkills} layout="vertical" margin={{ left: 20 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} />
                                        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                </div>
                 <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Alerts & Notifications</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.alerts.map((alertMsg, index) => (
                                <div key={index} className="flex items-start gap-3 rounded-md border p-3">
                                    <AlertTriangle className="h-5 w-5 text-destructive mt-1" />
                                    <p className="text-sm text-muted-foreground">{alertMsg}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Mock API Endpoints</CardTitle>
                            <CardDescription>This dashboard is powered by the following API endpoint.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs font-mono bg-muted p-4 rounded-md">
                            <p><span className="font-bold text-green-600">GET</span> /api/corporates/&#123;company_id&#125;/value_proposition</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}