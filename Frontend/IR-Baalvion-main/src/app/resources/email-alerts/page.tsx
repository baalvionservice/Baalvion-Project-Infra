"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { subscriptionService } from "@/core/services/subscription.service";
import { authService } from "@/core/services/auth.service";
import { Subscription } from "@/core/content/schemas";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Bell } from "lucide-react";

export default function EmailAlertsPage() {
    const [sub, setSub] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const loadData = async () => {
        setIsLoading(true);
        const { role } = await authService.getCurrentUser();
        const data = await subscriptionService.getSubscriptionByRole(role);
        setSub(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleToggle = (key: keyof Subscription['preferences']) => {
        if (!sub) return;
        const newPrefs = { ...sub.preferences, [key]: !sub.preferences[key] };
        setSub({ ...sub, preferences: newPrefs });
    };

    const handleSave = async () => {
        if (!sub) return;
        await subscriptionService.updatePreferences(sub.id, sub.preferences);
        toast({ title: "Preferences Updated", description: "Your notification settings have been saved securely." });
    };

    if (isLoading) return <div className="py-40 text-center">Initializing communication center...</div>;

    return (
        <>
            <section className="bg-black text-white py-12 md:py-20">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm font-bold text-primary tracking-widest mb-2">RESOURCES</p>
                    <h1 className="text-4xl md:text-5xl font-bold">Investor Email Alerts</h1>
                </div>
            </section>
            <section className="py-16 md:py-24 bg-white text-black">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="mb-12 space-y-6 text-sm text-gray-700">
                        <h2 className="text-3xl font-bold text-black text-center">Manage Your Subscriptions</h2>
                        <p>
                            Configure how you receive updates regarding Baalvion's financial reporting, board resolutions, and data room activity. 
                            All communications are encrypted and tracked for institutional compliance.
                        </p>
                    </div>

                    <div className="border-t border-gray-200 pt-12">
                        {sub ? (
                            <div className="space-y-8">
                                <div className="p-6 bg-gray-50 border rounded-lg flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Registered Email</p>
                                        <p className="text-lg font-bold">{sub.email}</p>
                                    </div>
                                    <Badge className="bg-primary text-primary-foreground">Verified Segment: {sub.role}</Badge>
                                </div>

                                <div className="space-y-4">
                                    <Label className="font-bold text-lg">Notification Channels</Label>
                                    <div className="grid gap-4">
                                        {Object.keys(sub.preferences).map((item) => (
                                            <div key={item} className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Bell className="h-5 w-5 text-primary" />
                                                    <div>
                                                        <p className="font-bold">{item} Updates</p>
                                                        <p className="text-xs text-gray-500">Real-time alerts for new {item.toLowerCase()} content.</p>
                                                    </div>
                                                </div>
                                                <Switch 
                                                    checked={sub.preferences[item as keyof typeof sub.preferences]} 
                                                    onCheckedChange={() => handleToggle(item as any)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <Button onClick={handleSave} className="bg-black text-white hover:bg-gray-800 rounded-sm px-8 py-6 text-lg">
                                    Save Preferences <span className="ml-2">&gt;</span>
                                </Button>
                            </div>
                        ) : (
                            <form className="space-y-8">
                                <p className="text-xs text-gray-600">* Required for public access</p>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="font-bold">Email Address *</Label>
                                    <Input id="email" type="email" placeholder="Your Email" className="bg-white focus-visible:ring-offset-0 border-gray-300" />
                                </div>
                                <div className="space-y-4">
                                    <Label className="font-bold">Public Mailing Lists *</Label>
                                    <div className="space-y-3">
                                        {["Press Releases", "Events", "Financial Reports"].map((item) => (
                                            <div key={item} className="flex items-center space-x-3">
                                                <Checkbox id={item} />
                                                <Label htmlFor={item} className="font-normal cursor-pointer text-sm">
                                                    {item}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Button type="submit" className="bg-black text-white hover:bg-gray-800 rounded-sm px-6 py-3">
                                    Subscribe <span className="ml-1">&gt;</span>
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${className}`}>{children}</span>;
}

function Switch({ checked, onCheckedChange }: { checked: boolean, onCheckedChange: () => void }) {
    return (
        <button 
            type="button"
            onClick={onCheckedChange}
            className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-gray-300'}`}
        >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checked ? 'left-7' : 'left-1'}`} />
        </button>
    );
}
