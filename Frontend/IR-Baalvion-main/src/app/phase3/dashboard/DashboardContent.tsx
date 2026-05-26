"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Bell,
    FileText,
    Download,
    Award,
    TrendingUp,
    Target,
    CheckCircle,
    Clock,
    Eye,
} from 'lucide-react';
import Link from 'next/link';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addMockEvent } from '@/lib/events';
import DocumentPreviewDialog from '@/components/shared/DocumentPreviewDialog';

type Document = {
    id: number;
    name: string;
    link: string;
};

interface DashboardContentProps {
    data: any;
}

export default function DashboardContent({ data }: DashboardContentProps) {
    const {
        name,
        expertise,
        grant,
        vesting,
        kpis,
        notifications,
        documents
    } = data;

    const { toast } = useToast();
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

    const handleDownload = (docName: string) => {
        toast({
            title: "Download Initiated",
            description: `Your download for ${docName} will begin shortly.`,
        });
        addMockEvent({ user: name, action: `Downloaded document: ${docName}`, phase: 'P3' });
    };

    const handlePreview = (doc: Document) => {
        setSelectedDoc(doc);
        setIsPreviewOpen(true);
    };

    return (
        <main className="flex-grow bg-muted/20 py-12">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold">Operator Dashboard</h1>
                    <p className="text-muted-foreground">Welcome, {name}. ({expertise})</p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Award />
                                    Equity Grant Overview
                                </CardTitle>
                                <CardDescription>Your strategic equity grant in Baalvion.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm text-muted-foreground">
                                        Total Grant
                                    </span>
                                    <span className="text-2xl font-bold">
                                        {grant.totalShares.toLocaleString()} shares
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm text-muted-foreground">
                                        Grant Type
                                    </span>
                                    <span className="text-2xl font-bold">
                                        {grant.type}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm text-muted-foreground">
                                        Grant Date
                                    </span>
                                    <span className="text-2xl font-bold">
                                        {grant.date}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp />
                                    Vesting Schedule & Progress
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className='space-y-4'>
                                    <h4 className="font-medium">Total Vesting Progress</h4>
                                    <Progress value={vesting.totalVestedPercent} className="h-4" />
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-green-400">{vesting.vestedShares.toLocaleString()} Vested</span>
                                        <span className="font-bold text-amber-400">{vesting.unvestedShares.toLocaleString()} Unvested</span>
                                    </div>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Schedule</p>
                                        <p className="font-medium">{vesting.schedule}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Cliff</p>
                                        <p className="font-medium">{vesting.cliffDate} ({vesting.cliffStatus})</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Monthly Vesting Start</p>
                                        <p className="font-medium">{vesting.vestingStartDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Next Vesting Event</p>
                                        <p className="font-medium">{vesting.nextVestingDate} ({vesting.nextVestingAmount.toLocaleString()} shares)</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target />
                                    Performance KPIs & Milestones
                                </CardTitle>
                                <CardDescription>Strategic objectives tied to accelerated vesting.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>KPI / Milestone</TableHead>
                                            <TableHead>Target</TableHead>
                                            <TableHead>Current Progress</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {kpis.map((kpi: any) => (
                                            <TableRow key={kpi.id}>
                                                <TableCell>
                                                    <p className='font-medium'>{kpi.name}</p>
                                                    <p className='text-xs text-muted-foreground'>Acceleration: {kpi.accelerationBonus} shares</p>
                                                </TableCell>
                                                <TableCell>{kpi.target}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={kpi.progress} className="h-2 w-[100px]" />
                                                        <span>{kpi.progress}%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={kpi.status === 'Achieved' ? 'default' : 'secondary'}>{kpi.status}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Bell /> Notifications</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {notifications.map((note: any) => (
                                        <div key={note.id} className="flex items-start gap-4 text-sm">
                                            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${note.type === 'milestone' ? 'bg-green-500/10' : 'bg-primary/10'} flex-shrink-0`}>
                                                {note.type === 'milestone' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-primary" />}
                                            </div>
                                            <div>
                                                <p className="font-medium">{note.message}</p>
                                                <p className="text-xs text-muted-foreground">{note.date}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>My Documents</CardTitle>
                                <CardDescription>Your signed legal and grant documents.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {documents.map((doc: any) => (
                                    <div key={doc.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted">
                                        <div className='flex items-center gap-2'>
                                            <FileText className='h-4 w-4 text-muted-foreground' />
                                            <p>{doc.name}</p>
                                        </div>
                                        <div>
                                            <Button variant="ghost" size="icon" onClick={() => handlePreview(doc)}>
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">View</span>
                                            </Button>
                                            <Button asChild variant="ghost" size="icon">
                                                <Link href={doc.link} onClick={() => handleDownload(doc.name)}>
                                                    <Download className="h-4 w-4" />
                                                    <span className="sr-only">Download</span>
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <DocumentPreviewDialog
                    isPreviewOpen={isPreviewOpen}
                    setIsPreviewOpen={setIsPreviewOpen}
                    selectedDoc={selectedDoc}
                />

            </div>
        </main>
    );
}
