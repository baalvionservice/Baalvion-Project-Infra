
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Download, FileText, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api-client';
import { format, formatDistanceToNow } from 'date-fns';

interface GdprData {
  statusCards: { title: string; status: string; description: string }[];
  subjectRequests: { id: string; type: string; name: string; submitted: string; status: string; dueDate: string }[];
  cookieConsent: { domain: string; rate: number }[];
  retentionPolicies: { dataType: string; period: string; legalBasis: string }[];
}
const EMPTY_GDPR: GdprData = { statusCards: [], subjectRequests: [], cookieConsent: [], retentionPolicies: [] };

const statusConfig = {
    Complete: { icon: CheckCircle, color: 'text-green-500' },
    Compliant: { icon: CheckCircle, color: 'text-green-500' },
    'In Place': { icon: CheckCircle, color: 'text-green-500' },
    Assigned: { icon: CheckCircle, color: 'text-green-500' },
    Pending: { icon: Clock, color: 'text-yellow-500' },
    'In Progress': { icon: Clock, color: 'text-yellow-500' },
    '89% Complete': { icon: Clock, color: 'text-yellow-500' }
};

const dsrStatusColors = {
  Pending: 'bg-yellow-100 text-yellow-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800'
}

export default function GdprPage() {
    const [gdprData, setGdprData] = useState<GdprData>(EMPTY_GDPR);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const d = await dashboardApi.gdpr();
                const obj = ((d as { data?: unknown })?.data ?? d) as GdprData;
                if (!cancelled && obj) setGdprData({ ...EMPTY_GDPR, ...obj });
            } catch { /* leave empty */ }
        })();
        return () => { cancelled = true; };
    }, []);
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">GDPR & Data Privacy</h1>
                <p className="text-muted-foreground">
                    Monitor and manage your data privacy compliance.
                </p>
            </div>

            <Card>
                <CardHeader><CardTitle>Data Processing Status</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                    {gdprData.statusCards.map(card => {
                        const Icon = statusConfig[card.status as keyof typeof statusConfig]?.icon || XCircle;
                        const color = statusConfig[card.status as keyof typeof statusConfig]?.color || 'text-red-500';
                        return (
                            <Card key={card.title} className="flex flex-col">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                                        <Icon className={`h-4 w-4 ${color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="text-2xl font-bold">{card.status}</div>
                                    <p className="text-xs text-muted-foreground">{card.description}</p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Data Subject Requests (DSR)</CardTitle>
                        <CardDescription>Active and recently completed requests.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Submitted</TableHead>
                                        <TableHead>Due In</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {gdprData.subjectRequests.map(req => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">{req.type}</TableCell>
                                            <TableCell><Badge className={dsrStatusColors[req.status as keyof typeof dsrStatusColors]}>{req.status}</Badge></TableCell>
                                            <TableCell>{formatDistanceToNow(new Date(req.submitted), { addSuffix: true })}</TableCell>
                                            <TableCell>{formatDistanceToNow(new Date(req.dueDate), { addSuffix: true })}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Cookie Consent Rates</CardTitle>
                        <CardDescription>Acceptance rate for cookie banners on your domains.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {gdprData.cookieConsent.map(consent => (
                            <div key={consent.domain}>
                                <div className="flex justify-between mb-1 text-sm">
                                    <span className="font-medium">{consent.domain}</span>
                                    <span className="text-muted-foreground">{consent.rate}%</span>
                                </div>
                                <Progress value={consent.rate} />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Data Retention Policies</CardTitle>
                        <CardDescription>Official policies for data storage duration and legal basis.</CardDescription>
                    </div>
                     <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Download GDPR Report</Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data Type</TableHead>
                                    <TableHead>Retention Period</TableHead>
                                    <TableHead>Legal Basis</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {gdprData.retentionPolicies.map(policy => (
                                    <TableRow key={policy.dataType}>
                                        <TableCell className="font-medium">{policy.dataType}</TableCell>
                                        <TableCell>{policy.period}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">{policy.legalBasis}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
