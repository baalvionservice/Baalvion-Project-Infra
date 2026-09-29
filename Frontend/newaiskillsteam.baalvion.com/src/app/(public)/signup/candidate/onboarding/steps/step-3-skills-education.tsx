
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { OnboardingData } from '../onboarding-flow';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
    skills: z.string().min(1, 'Please enter at least one skill.'),
    certifications: z.any().optional(),
    degree: z.string().min(2, 'Degree is required.'),
    institute: z.string().min(3, 'Institute name is required.'),
    gradYear: z.string().length(4, 'Please enter a valid 4-digit year.'),
    portfolioUrl: z.string().url().optional().or(z.literal('')),
    githubUrl: z.string().url().optional().or(z.literal('')),
    linkedinUrl: z.string().url().optional().or(z.literal('')),
});

interface Step3Props {
    onNext: (data: Partial<OnboardingData>) => void;
    data: Partial<OnboardingData>;
}

export function Step3SkillsEducation({ onNext, data }: Step3Props) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            skills: data.skills || '',
            degree: data.degree || '',
            institute: data.institute || '',
            gradYear: data.gradYear || '',
            portfolioUrl: data.portfolioUrl || '',
            githubUrl: data.githubUrl || '',
            linkedinUrl: data.linkedinUrl || '',
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        onNext({
            ...values,
            certifications: values.certifications?.[0],
        });
    }
    
    return (
        <Form {...form}>
            <form id="step-2-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Skills</FormLabel>
                            <FormControl><Input placeholder="React, Node.js, Python, Figma" {...field} /></FormControl>
                            <FormDescription>Enter your skills, separated by commas.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="degree"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Highest Degree</FormLabel>
                                <FormControl><Input placeholder="e.g., Bachelor of Science" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="institute"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Institute</FormLabel>
                                <FormControl><Input placeholder="e.g., University of California" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="gradYear"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Graduation Year</FormLabel>
                            <FormControl><Input type="number" placeholder="e.g., 2022" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="certifications"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                        <FormItem>
                            <FormLabel>Certifications (Optional)</FormLabel>
                            <FormControl>
                                <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onChange(e.target.files)} {...fieldProps} />
                            </FormControl>
                            <FormDescription>Upload any relevant certifications or badges.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField
                        control={form.control}
                        name="portfolioUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Portfolio URL (Optional)</FormLabel>
                                <FormControl><Input placeholder="https://yourportfolio.com" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                      <FormField
                        control={form.control}
                        name="githubUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>GitHub URL (Optional)</FormLabel>
                                <FormControl><Input placeholder="https://github.com/your-username" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>LinkedIn URL (Optional)</FormLabel>
                            <FormControl><Input placeholder="https://linkedin.com/in/yourprofile" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}
