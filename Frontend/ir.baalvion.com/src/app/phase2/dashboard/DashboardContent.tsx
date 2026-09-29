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
    Briefcase,
    BarChart,
    DollarSign,
    CheckCircle2,
    Users,
    Calendar,
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
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import MeetingSchedulerModal from '@/components/dashboard/MeetingSchedulerModal';

interface DashboardContentProps {
    data: any; // Using any for now to match phase2InvestorData structure
}

export default function DashboardContent({ data }: DashboardContentProps) {
    const { name, spv, capitalAccount, activity } = data;
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

    return (
        <main className="flex-grow bg-muted/20 py-12">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold">Phase 2 Dashboard</h1>
                    <p className="text-muted-foreground">Welcome, {name}.</p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase />
                                    SPV Overview: {spv.dealName}
                                </CardTitle>
                                <CardDescription>
                                    Your investment vehicle for this specific deal.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm text-muted-foreground">
                                        Total Commitment
                                    </span>
                                    <span className="text-2xl font-bold">
                                        ${spv.commitment.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm text-muted-foreground">
                                        Profit Sharing
                                    </span>
                                    <span className="text-lg font-bold">
                                        {spv.profitSharing}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm text-muted-foreground">
                                        SPV Status
                                    </span>
                                    <Badge className='w-fit mt-1' variant={spv.status === 'Active' ? 'default' : 'secondary'}>{spv.status}</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign />
                                    Capital Account Summary
                                </CardTitle>
                                <CardDescription>
                                    Your financial position within the SPV.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm text-muted-foreground">Total Contributions</span>
                                        <span className="text-xl font-bold text-green-400">${capitalAccount.contributions.toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm text-muted-foreground">Distributions</span>
                                        <span className="text-xl font-bold">${capitalAccount.distributions.toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm text-muted-foreground">Account Balance</span>
                                        <span className="text-xl font-bold">${capitalAccount.balance.toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm text-muted-foreground">Unfunded Commitment</span>
                                        <span className="text-xl font-bold text-amber-400">${capitalAccount.unfundedCommitment.toLocaleString()}</span>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="font-medium mb-2">Capital Deployment</h4>
                                    <Progress value={(capitalAccount.contributions / capitalAccount.commitment) * 100} className="h-4 mt-2" />
                                    <p className="text-xs text-right text-muted-foreground mt-1">{((capitalAccount.contributions / capitalAccount.commitment) * 100).toFixed(1)}% Deployed</p>
                                </div>
                                <div className='flex gap-2'>
                                    <Button variant="outline">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Capital Statement
                                    </Button>
                                    <Button>
                                        Initiate Fund Transfer
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users />
                                    SPV Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col space-y-3">
                                <Button asChild>
                                    <Link href="/phase2/data-room">
                                        <FileText />
                                        View SPV Data Room
                                    </Link>
                                </Button>
                                <Button variant="outline">
                                    <BarChart />
                                    View Performance Metrics
                                </Button>
                                <Dialog open={isMeetingModalOpen} onOpenChange={setIsMeetingModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline">
                                            <Calendar />
                                            Schedule Meeting
                                        </Button>
                                    </DialogTrigger>
                                    <MeetingSchedulerModal closeModal={() => setIsMeetingModalOpen(false)} />
                                </Dialog>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell />
                                    Recent Activity & Notifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {activity.map((item: any) => (
                                        <div key={item.id} className="flex items-start gap-4 text-sm">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                                                <CheckCircle2 className={`h-4 w-4 ${item.status === 'Action Required' ? 'text-amber-400' : 'text-primary'}`} />
                                            </div>
                                            <div>
                                                <p className="font-medium">{item.description}</p>
                                                <p className="text-xs text-muted-foreground">{item.date}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
}
