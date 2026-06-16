

'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
    PlusCircle, 
    Settings, 
    CheckCircle, 
    User, 
    ToggleRight, 
    Bell, 
    FileText, 
    ShieldCheck,
    Save,
    FileCheck2,
    Bot
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SchemaFormDialog } from "./schema-form-dialog";
import { mockEvaluationSchemas } from "@/lib/mock-data"; 
import type { EvaluationSchema } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function AdminSettingsPage() {
    const { toast } = useToast();
    const [schemas, setSchemas] = useState<EvaluationSchema[]>(mockEvaluationSchemas);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedSchema, setSelectedSchema] = useState<EvaluationSchema | null>(null);

    // Mock states for settings
    const [allowPublicSignup, setAllowPublicSignup] = useState(true);
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    const handleAddNewSchema = () => {
        setSelectedSchema(null);
        setIsDialogOpen(true);
    };

    const handleEditSchema = (schema: EvaluationSchema) => {
        setSelectedSchema(schema);
        setIsDialogOpen(true);
    };
    
    const handleSaveSchema = (schemaData: EvaluationSchema) => {
        if (selectedSchema) {
            setSchemas(schemas.map(s => s.id === schemaData.id ? schemaData : s));
        } else {
            setSchemas([...schemas, { ...schemaData, id: `schema-${Date.now()}` }]);
        }
        toast({ title: 'Schema saved successfully!' });
    };

    const handleSaveChanges = () => {
        toast({
            title: "Settings Saved",
            description: "Your changes have been saved successfully.",
        });
    };

    return (
    <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <div>
                <h2 className="font-headline text-3xl font-bold tracking-tight">
                    Platform Settings
                </h2>
                <p className="text-muted-foreground">
                    Configure global settings for the ControlTheMarket platform.
                </p>
            </div>
             <div className="flex items-center space-x-2">
                <Button onClick={handleSaveChanges}><Save className="mr-2 h-4 w-4" /> Save All Changes</Button>
            </div>
        </div>
      
        <div className="grid gap-6 lg:grid-cols-2">
            {/* User Permissions Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />User Permissions</CardTitle>
                    <CardDescription>Configure roles, access levels, and sign-up settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                        <Label htmlFor="public-signup" className="flex flex-col space-y-1">
                            <span>Allow Public Sign-ups</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Allow new users to register for accounts.
                            </span>
                        </Label>
                        <Switch id="public-signup" checked={allowPublicSignup} onCheckedChange={setAllowPublicSignup} />
                    </div>
                     <div className="space-y-2">
                        <Label>Default Role for New Users</Label>
                        <Select defaultValue="candidate">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="candidate">Candidate</SelectItem>
                                <SelectItem value="company">Company</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* System Preferences Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ToggleRight className="h-5 w-5" />System Preferences</CardTitle>
                    <CardDescription>Manage general platform behavior and features.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                        <Label htmlFor="maintenance-mode" className="flex flex-col space-y-1">
                            <span>Maintenance Mode</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Temporarily disable access to the platform for non-admins.
                            </span>
                        </Label>
                        <Switch id="maintenance-mode" checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="welcome-message">Platform Welcome Message</Label>
                        <Input id="welcome-message" placeholder="Welcome to ControlTheMarket!" />
                    </div>
                </CardContent>
            </Card>

            {/* Notification Settings Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Notification Settings</CardTitle>
                    <CardDescription>Manage which notifications are sent by default.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-start space-x-2">
                        <Checkbox id="notif-new-submission" defaultChecked />
                        <div className="grid gap-1.5 leading-none">
                            <label htmlFor="notif-new-submission" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                New Submission Received
                            </label>
                            <p className="text-sm text-muted-foreground">Notify companies when a candidate submits work.</p>
                        </div>
                    </div>
                     <div className="flex items-start space-x-2">
                        <Checkbox id="notif-eval-complete" defaultChecked />
                        <div className="grid gap-1.5 leading-none">
                            <label htmlFor="notif-eval-complete" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Evaluation Completed
                            </label>
                            <p className="text-sm text-muted-foreground">Notify candidates when their submission is evaluated.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Task & Submission Settings Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Task & Submission Settings</CardTitle>
                    <CardDescription>Set global limits and rules for tasks and submissions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="max-upload-size">Max File Upload Size (MB)</Label>
                        <Input id="max-upload-size" type="number" defaultValue={50} />
                    </div>
                    <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                        <Label htmlFor="allow-resubmission" className="flex flex-col space-y-1">
                            <span>Allow Resubmissions</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Allow candidates to resubmit work after an evaluation by default.
                            </span>
                        </Label>
                        <Switch id="allow-resubmission" defaultChecked />
                    </div>
                </CardContent>
            </Card>

            {/* Auto-Validation Rules Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileCheck2 className="h-5 w-5" />Auto-Validation Rules</CardTitle>
                    <CardDescription>Configure automatic checks for all new submissions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                        <Label htmlFor="check-linting" className="flex flex-col space-y-1">
                            <span>Linting & Code Style Check</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Automatically run a linter (e.g., ESLint) on code submissions.
                            </span>
                        </Label>
                        <Switch id="check-linting" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                        <Label htmlFor="check-deps" className="flex flex-col space-y-1">
                            <span>Dependency Audit</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Scan for known vulnerabilities in `package.json`.
                            </span>
                        </Label>
                        <Switch id="check-deps" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                        <Label htmlFor="check-plagiarism" className="flex flex-col space-y-1">
                            <span>Plagiarism Check</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Compare submission against a database of public code.
                            </span>
                        </Label>
                        <Switch id="check-plagiarism" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" asChild>
                        <Link href="/admin/automation">Configure Automation</Link>
                    </Button>
                </CardFooter>
            </Card>

            {/* Security & Access Logs Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Security & Access</CardTitle>
                    <CardDescription>Monitor security settings and access logs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                        <Input id="session-timeout" type="number" defaultValue={60} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" asChild>
                        <Link href="/admin/activity">View Access Logs</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>

        {/* Evaluation Schemas Card */}
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />Auto-Scoring Logic (Evaluation Schemas)</CardTitle>
                <CardDescription>Manage the criteria, weights, and rules used by the auto-scoring system to evaluate candidate submissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {schemas.map(schema => (
                        <Card key={schema.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-base">
                                <span>{schema.name}</span>
                                <Badge variant={schema.isActive ? 'default' : 'outline'}>
                                        {schema.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                </CardTitle>
                                <CardDescription>{schema.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">Criteria ({schema.criteria.length})</h4>
                                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                        {schema.criteria.slice(0, 3).map(crit => <li key={crit.id}>{crit.name} (w: {crit.weight})</li>)}
                                        {schema.criteria.length > 3 && <li>...and {schema.criteria.length - 3} more</li>}
                                    </ul>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <Button variant="outline" size="sm" onClick={() => handleEditSchema(schema)}>
                                    <Settings className="mr-2 h-4 w-4" /> Edit Rule
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleAddNewSchema}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Rule Schema
                </Button>
            </CardFooter>
        </Card>

       <SchemaFormDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSave={handleSaveSchema}
            schema={selectedSchema}
        />
    </div>
    );
}
