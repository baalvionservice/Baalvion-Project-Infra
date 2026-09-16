
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin } from 'lucide-react';

const formSchema = z.object({
    name: z.string().min(2, 'Name is required.'),
    email: z.string().email('Please enter a valid email.'),
    subject: z.string().min(1, 'Please select a subject.'),
    message: z.string().min(10, 'Message must be at least 10 characters.'),
});

export default function ContactPage() {
    const { toast } = useToast();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: '', email: '', subject: '', message: '' },
    });

    function onSubmit(_values: z.infer<typeof formSchema>) {
        toast({ title: 'Message Sent!', description: 'Thanks for reaching out. We will get back to you shortly.' });
        form.reset();
    }

    return (
        <div className="container py-12 md:py-20">
            <div className="mx-auto max-w-4xl text-center">
                <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
                    Get in Touch
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Have a question or want to learn more? We'd love to hear from you.
                </p>
            </div>
            
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Send us a Message</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField name="name" control={form.control} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name</FormLabel>
                                                <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField name="email" control={form.control} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl><Input placeholder="john.doe@example.com" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                    <FormField name="subject" control={form.control} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subject</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Sales Inquiry">Sales Inquiry</SelectItem>
                                                    <SelectItem value="Support Request">Support Request</SelectItem>
                                                    <SelectItem value="Partnership">Partnership</SelectItem>
                                                    <SelectItem value="General Question">General Question</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField name="message" control={form.control} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Message</FormLabel>
                                            <FormControl><Textarea placeholder="Your message..." rows={6} {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <Button type="submit">Send Message</Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-4">
                                <Mail className="h-5 w-5 text-primary mt-1" />
                                <div>
                                    <h4 className="font-semibold">Email</h4>
                                    <p className="text-sm text-muted-foreground hover:text-primary cursor-pointer">support@skillmatch.pro</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <Phone className="h-5 w-5 text-primary mt-1" />
                                <div>
                                    <h4 className="font-semibold">Phone</h4>
                                    <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <MapPin className="h-5 w-5 text-primary mt-1" />
                                <div>
                                    <h4 className="font-semibold">Office</h4>
                                    <p className="text-sm text-muted-foreground">123 Skill Avenue, <br /> San Francisco, CA 94105</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
