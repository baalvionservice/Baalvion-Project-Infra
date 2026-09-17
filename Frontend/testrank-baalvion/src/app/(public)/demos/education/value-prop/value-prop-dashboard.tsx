'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Bell, Users, BookOpen, PlayCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ValuePropositionData {
  live_assessments: { student: string; batch: string; assessment: string; status: string; score: number; video_url: string; }[];
  dashboard_stats: {
    total_students: number;
    assessments_completed: number;
    average_score: number;
    pass_fail_rates: { passed: number; failed: number; pending: number; };
    top_skills: { [key: string]: number; };
  };
  alerts: string[];
}

interface ValuePropDashboardProps {
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

export function ValuePropDashboard({ data }: ValuePropDashboardProps) {
    const COLORS: { [key: string]: string } = {
        'Passed': '#00C49F',
        'Failed': '#FF8042',
        'Pending': '#FFBB28',
    };
    
    const passFailData = Object.entries(data.dashboard_stats.pass_fail_rates).map(([name, value]) => ({ name, value }));
    const topSkillsData = Object.entries(data.dashboard_stats.top_skills).map(([name, value]) => ({ name, value }));

    return (
        <div className="space-y-8 mt-8">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <CardTitle className="text-sm font-medium">Assessments Completed</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.dashboard_stats.assessments_completed}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.dashboard_stats.average_score}%</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Live Student Assessments</CardTitle>
                            <CardDescription>Monitor student progress and review recorded sessions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Assessment</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.live_assessments.map(assessment => (
                                    <TableRow key={assessment.student}>
                                        <TableCell className="font-medium">{assessment.student}<br/><span className="text-xs text-muted-foreground">{assessment.batch}</span></TableCell>
                                        <TableCell>{assessment.assessment}</TableCell>
                                        <TableCell className="font-semibold">{assessment.score > 0 ? `${assessment.score}%` : 'N/A'}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(assessment.status)}>{assessment.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <a href={assessment.video_url} target="_blank" rel="noopener noreferrer">
                                                    <PlayCircle className="mr-2 h-4 w-4" /> Watch
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
                                <CardTitle className="text-base">Pass/Fail Rates</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={passFailData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                            {passFailData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Top Skills Demonstrated</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={topSkillsData} layout="vertical" margin={{ left: 20 }}>
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
                            <CardDescription>This dashboard is powered by the following API endpoints.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs font-mono bg-muted p-4 rounded-md">
                            <p><span className="font-bold text-green-600">GET</span> /api/educational_institutions/&#123;id&#125;/assessments</p>
                            <p><span className="font-bold text-green-600">GET</span> /api/educational_institutions/&#123;id&#125;/analytics</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
