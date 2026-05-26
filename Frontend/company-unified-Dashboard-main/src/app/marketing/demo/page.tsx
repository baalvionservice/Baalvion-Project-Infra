'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';
import countriesData from '@/lib/data/countries.json';

export default function DemoPage() {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setSubmitted(true);
            toast({
                title: 'Demo Request Received!',
                description: 'We will be in touch with you shortly.',
            });
        }, 1500);
    };

    if (submitted) {
        return (
            <div className="container mx-auto px-4 py-32 flex items-center justify-center">
                <Card className="w-full max-w-lg text-center">
                    <CardHeader>
                        <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <CardTitle className="mt-4">Thank You!</CardTitle>
                        <CardDescription>We've received your demo request and will be in touch within 24 hours to schedule a time that works for you.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-32 flex items-center justify-center">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Book a Demo</CardTitle>
                    <CardDescription>See how Baalvion can transform your global operations. Fill out the form below to schedule a 30-minute demo with our team.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="email">Work Email</Label>
                                <Input id="email" type="email" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Company Name</Label>
                            <Input id="company" required />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="team-size">Team Size</Label>
                                <Select required>
                                    <SelectTrigger id="team-size"><SelectValue placeholder="Select size..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1-10">1-10 employees</SelectItem>
                                        <SelectItem value="11-50">11-50 employees</SelectItem>
                                        <SelectItem value="51-200">51-200 employees</SelectItem>
                                        <SelectItem value="201-1000">201-1000 employees</SelectItem>
                                        <SelectItem value="1000+">1000+ employees</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Select required>
                                    <SelectTrigger id="country"><SelectValue placeholder="Select country..." /></SelectTrigger>
                                    <SelectContent>
                                        {countriesData.map(c => <SelectItem key={c.id} value={c.name}>{c.flag} {c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Book a 30-minute demo
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
