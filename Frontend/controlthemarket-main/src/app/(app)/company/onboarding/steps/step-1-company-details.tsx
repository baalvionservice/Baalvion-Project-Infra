'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { OnboardingData } from '../onboarding-flow';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const countries = ['United States', 'India', 'United Kingdom', 'Germany', 'Canada'];

const formSchema = z.object({
    companyName: z.string().min(2, 'Company name must be at least 2 characters.'),
    country: z.string({ required_error: "Please select a country." }),
    companyWebsite: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
    companyDescription: z.string().min(10, 'Description must be at least 10 characters.').optional().or(z.literal('')),
});

interface Step1Props {
    onNext: (data: Partial<OnboardingData>) => void;
    data: Partial<OnboardingData>;
}

export function Step1CompanyDetails({ onNext, data }: Step1Props) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            companyName: data.companyName,
            country: data.country,
            companyWebsite: data.companyWebsite,
            companyDescription: data.companyDescription,
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        onNext(values);
    }
    
    return (
        <Form {...form}>
            <form id="step-0-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Company Name</FormLabel>
                                <FormControl><Input placeholder="Your Company Inc." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Country of Operation</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a country" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {countries.map(country => (
                                            <SelectItem key={country} value={country}>{country}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="companyWebsite"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Company Website</FormLabel>
                            <FormControl><Input placeholder="https://yourcompany.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="companyDescription"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Company Description</FormLabel>
                            <FormControl><Textarea placeholder="What does your company do?" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}
