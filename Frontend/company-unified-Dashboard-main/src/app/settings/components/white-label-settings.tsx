'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UploadCloud, Image as ImageIcon, ExternalLink, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import EmailPreviewModal from './email-preview-modal';

export default function WhiteLabelSettings() {
    const { toast } = useToast();
    const [branding, setBranding] = useState({
        platformName: 'Baalvion',
        sidebarBackground: '233 7% 15%',
        primaryAccent: '226 82% 44%',
    });
    const [emailSettings, setEmailSettings] = useState({
        senderName: 'Baalvion',
        senderEmail: 'noreply@baalvion.com',
        footer: '© 2024 Baalvion. All rights reserved.'
    });
    const [isEmailPreviewOpen, setEmailPreviewOpen] = useState(false);

    const applyBranding = (config: typeof branding) => {
        document.documentElement.style.setProperty('--sidebar-background', config.sidebarBackground);
        document.documentElement.style.setProperty('--primary', config.primaryAccent);
    };

    useEffect(() => {
        const savedBranding = localStorage.getItem('baalvion-branding');
        if (savedBranding) {
            try {
                const parsed = JSON.parse(savedBranding);
                setBranding(parsed);
                applyBranding(parsed);
            } catch (e) {
                console.error("Failed to parse branding from localStorage", e);
            }
        }
    }, []);

    const handleBrandingChange = (field: keyof typeof branding, value: string) => {
        setBranding(prev => ({ ...prev, [field]: value }));
    };
    
    const handleSaveChanges = () => {
        localStorage.setItem('baalvion-branding', JSON.stringify(branding));
        applyBranding(branding);
        toast({
            title: "White Label Settings Saved",
            description: "Your branding customizations have been updated.",
        });
    };
    
    const handleEmailSaveChanges = () => {
        toast({
            title: "Email Settings Saved",
            description: "Your email customizations have been updated.",
        });
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>White Label Settings</CardTitle>
                    <CardDescription>Customize the look and feel of the platform to match your brand.
                        <Badge className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                            White Label is available on the Enterprise plan <Button variant="link" className="p-0 h-auto ml-1">Upgrade</Button>
                        </Badge>
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Branding Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Branding</CardTitle>
                            <CardDescription>Set your platform's name, logos, and brand colors.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="platform-name">Platform Name</Label>
                                <Input id="platform-name" value={branding.platformName} onChange={(e) => handleBrandingChange('platformName', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Platform Logo</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center"><ImageIcon className="w-8 h-8 text-muted-foreground" /></div>
                                        <div className="flex-1 flex items-center justify-center w-full h-16 border-2 border-dashed rounded-md cursor-pointer">
                                            <div className="text-center">
                                                <UploadCloud className="mx-auto h-6 w-6 text-muted-foreground" />
                                                <p className="text-xs text-muted-foreground">Click or drag to upload</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Favicon</Label>
                                     <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center"><ImageIcon className="w-8 h-8 text-muted-foreground" /></div>
                                        <div className="flex-1 flex items-center justify-center w-full h-16 border-2 border-dashed rounded-md cursor-pointer">
                                            <div className="text-center">
                                                <UploadCloud className="mx-auto h-6 w-6 text-muted-foreground" />
                                                <p className="text-xs text-muted-foreground">Click or drag to upload</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sidebar-bg-color">Sidebar Background (HSL)</Label>
                                    <Input id="sidebar-bg-color" value={branding.sidebarBackground} onChange={e => handleBrandingChange('sidebarBackground', e.target.value)} />
                                    <p className="text-xs text-muted-foreground">e.g., 233 7% 15%</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="primary-accent-color">Primary Accent (HSL)</Label>
                                    <Input id="primary-accent-color" value={branding.primaryAccent} onChange={e => handleBrandingChange('primaryAccent', e.target.value)} />
                                    <p className="text-xs text-muted-foreground">e.g., 226 82% 44%</p>
                                </div>
                            </div>
                        </CardContent>
                         <CardFooter>
                            <Button onClick={handleSaveChanges}>Save Branding</Button>
                        </CardFooter>
                    </Card>

                    {/* Custom Domain Section */}
                    <Card>
                        <CardHeader><CardTitle>Custom Domain</CardTitle><CardDescription>Set a custom domain for your platform.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label>Current Domain</Label>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">app.baalvion.com <ExternalLink className="h-4 w-4" /></div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="custom-domain">Custom Domain</Label>
                                <Input id="custom-domain" placeholder="e.g., portal.yourcompany.com" />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div><Label>SSL Status</Label><p className="flex items-center gap-2 text-sm text-green-600"><ShieldCheck className="h-4 w-4" /> Active</p></div>
                                <Button variant="secondary">Check Status</Button>
                            </div>
                            <Accordion type="single" collapsible>
                                <AccordionItem value="dns">
                                    <AccordionTrigger>DNS Instructions</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-sm text-muted-foreground mb-4">Add the following CNAME record to your DNS provider to point your domain to Baalvion.</p>
                                        <pre className="p-4 rounded-md bg-gray-900 text-white text-sm overflow-x-auto"><code>your-subdomain CNAME target.baalvion.com</code></pre>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    {/* Email Customization Section */}
                    <Card>
                        <CardHeader><CardTitle>Email Customization</CardTitle><CardDescription>Customize the automated emails sent from your platform.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="sender-name">Sender Name</Label><Input id="sender-name" value={emailSettings.senderName} onChange={e => setEmailSettings({...emailSettings, senderName: e.target.value})} /></div>
                                <div className="space-y-2"><Label htmlFor="sender-email">Sender Email</Label><Input id="sender-email" type="email" value={emailSettings.senderEmail} onChange={e => setEmailSettings({...emailSettings, senderEmail: e.target.value})} /></div>
                            </div>
                             <div className="space-y-2">
                                <Label>Email Logo</Label>
                                <div className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-md cursor-pointer">
                                    <div className="text-center">
                                        <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">Click or drag to upload logo</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email-footer">Email Footer</Label>
                                <Textarea id="email-footer" value={emailSettings.footer} onChange={e => setEmailSettings({...emailSettings, footer: e.target.value})} />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between">
                            <Button variant="outline" onClick={() => setEmailPreviewOpen(true)}>Preview Email</Button>
                            <Button onClick={handleEmailSaveChanges}>Save Email Settings</Button>
                        </CardFooter>
                    </Card>

                </div>

                {/* Live Preview Panel */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-20">
                        <CardHeader><CardTitle>Live Preview</CardTitle></CardHeader>
                        <CardContent>
                             <div className="w-full h-96 rounded-md border flex overflow-hidden bg-background">
                                {/* Preview Sidebar */}
                                <div className="w-1/3 h-full p-2 flex flex-col gap-2 bg-sidebar text-sidebar-foreground">
                                    <div className="text-sm font-bold truncate">{branding.platformName}</div>
                                    <div className="w-full h-8 rounded-md bg-primary"></div>
                                    <div className="w-full h-8 rounded-md bg-sidebar-accent opacity-50"></div>
                                </div>
                                {/* Preview Content */}
                                <div className="w-2/3 h-full p-4">
                                    <Button>Example Button</Button>
                                     <div className="mt-4 p-2 rounded-md border border-green-500">
                                         <p className="text-sm font-medium text-green-600">Success Message!</p>
                                     </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
             <EmailPreviewModal 
                isOpen={isEmailPreviewOpen} 
                onOpenChange={setEmailPreviewOpen} 
                branding={{
                    primary: `hsl(${branding.sidebarBackground})`,
                    accent: `hsl(${branding.primaryAccent})`,
                    platformName: branding.platformName
                }}
                emailSettings={emailSettings}
            />
        </div>
    );
}
