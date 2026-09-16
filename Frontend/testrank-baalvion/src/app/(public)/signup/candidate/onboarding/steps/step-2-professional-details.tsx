
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { OnboardingData } from '../onboarding-flow';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const formSchema = z.object({
    lastJobTitle: z.string().min(2, 'Job title is required.'),
    lastCompany: z.string().min(2, 'Company name is required.'),
    salary: z.coerce.number().positive('Salary must be a positive number.').optional(),
    currency: z.string().optional(),
    proofDoc: z.any().optional(),
    experience: z.string().min(50, 'Please describe your experience in at least 50 characters.'),
});

interface Step2Props {
    onNext: (data: Partial<OnboardingData>) => void;
    data: Partial<OnboardingData>;
}

export function Step2ProfessionalDetails({ onNext, data }: Step2Props) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            lastJobTitle: data.lastJobTitle || '',
            lastCompany: data.lastCompany || '',
            salary: data.salary || undefined,
            currency: data.currency || 'USD',
            experience: data.experience || '',
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        onNext({
            ...values,
            proofDoc: values.proofDoc?.[0]
        });
    }
    
    return (
        <Form {...form}>
            <form id="step-1-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="lastJobTitle"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last Job Title</FormLabel>
                                <FormControl><Input placeholder="e.g., Software Engineer" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="lastCompany"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last Company Name</FormLabel>
                                <FormControl><Input placeholder="e.g., TechCorp" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <FormField
                        control={form.control}
                        name="salary"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Last Drawn Salary (Optional)</FormLabel>
                                <FormControl><Input type="number" placeholder="e.g., 80000" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Currency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="GBP">GBP</SelectItem>
                                        <SelectItem value="INR">INR</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Work Experience Details</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Describe your roles, responsibilities, and key achievements..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="proofDoc"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                        <FormItem>
                            <FormLabel>Resignation/Offer Letter (Optional)</FormLabel>
                            <FormControl>
                                <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onChange(e.target.files)} {...fieldProps} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}
