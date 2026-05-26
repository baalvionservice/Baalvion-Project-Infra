

'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
    Building, 
    Bell, 
    CreditCard,
    Save
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Company } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { TeamManagementCard } from "./team-management-card";
import { DomainManagementCard } from "./domain-management-card";
import Link from 'next/link';

export default function CompanySettingsPage() {
    const { user, plan } = useAuth();
    const { toast } = useToast();
    
    // Mock company data - in a real app this would be fetched
    const [companyName, setCompanyName] = useState(user?.companyName || 'Your Company');
    const [companyDescription, setCompanyDescription] = useState('A description of your company.');
    

    const handleSaveChanges = () => {
        toast({
            title: "Settings Saved",
            description: "Your company settings have been updated.",
        });
    };

    return (
    <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <div>
                <h2 className="font-headline text-3xl font-bold tracking-tight">
                    Company Settings
                </h2>
                <p className="text-muted-foreground">
                    Manage your company profile, users, and evaluation settings.
                </p>
            </div>
             <div className="flex items-center space-x-2">
                <Button onClick={handleSaveChanges}>
                    <Save className="mr-2 h-4 w-4" /> Save All Changes
                </Button>
            </div>
        </div>
      
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Company Profile Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" />Company Profile</CardTitle>
                    <CardDescription>Update your company's public information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)}/>
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="companyDescription">Description</Label>
                        <Textarea id="companyDescription" value={companyDescription} onChange={e => setCompanyDescription(e.target.value)}/>
                    </div>
                </CardContent>
            </Card>

             {/* User Management Card */}
            <TeamManagementCard />

            <div className="lg:col-span-2">
              <DomainManagementCard />
            </div>

            {/* Notification Settings Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Notification Settings</CardTitle>
                    <CardDescription>Manage your company's notification preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="notif-new-submission" className="flex-1">
                            New Submission Received
                        </Label>
                        <Switch id="notif-new-submission" defaultChecked />
                    </div>
                     <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="notif-deadline" className="flex-1">
                            Task Deadline Reminders
                        </Label>
                        <Switch id="notif-deadline" defaultChecked />
                    </div>
                     <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="notif-summary" className="flex-1">
                           Weekly Activity Summary
                        </Label>
                        <Switch id="notif-summary" />
                    </div>
                </CardContent>
            </Card>

             {/* Subscription Plan Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Subscription Plan</CardTitle>
                    <CardDescription>Manage your current plan and billing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-md border p-4">
                        <div>
                            <p className="font-bold text-lg">{plan?.name || 'Loading...'} Plan</p>
                            <p className="text-sm text-muted-foreground">${plan?.priceMonthly || 0} / month</p>
                        </div>
                        <Button variant="outline" asChild>
                           <Link href="/company/subscription">Manage Subscription</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
    );
}
