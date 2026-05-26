'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { OnboardingData } from '../onboarding-flow';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateTaskDescriptionAction } from '../../tasks/create/actions';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';


const formSchema = z.object({
    taskTitle: z.string().min(5, 'Task title must be at least 5 characters.'),
    taskDescription: z.string().min(20, 'Task description must be at least 20 characters.'),
});

interface Step3Props {
    onNext: (data: Partial<OnboardingData>) => void;
    data: Partial<OnboardingData>;
}

export function Step3CreateTask({ onNext, data }: Step3Props) {
    const { toast } = useToast();
    const [isAiLoading, setIsAiLoading] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            taskTitle: data.taskTitle,
            taskDescription: data.taskDescription,
        },
    });

    const handleGenerateDescription = async () => {
        const title = form.getValues('taskTitle');
        if (!title) {
            toast({ title: "Please enter a task title first.", variant: "destructive" });
            return;
        }
        setIsAiLoading(true);
        try {
            const result = await generateTaskDescriptionAction({
                taskTitle: title,
                keywords: ['frontend', 'react'],
                descriptionRequirements: 'Create a simple, reusable component.',
                skillsRequired: ['React', 'TypeScript'],
                difficulty: 'Intermediate',
                durationEstimate: '2 hours'
            });
            if (result.success && result.data) {
                form.setValue('taskDescription', result.data.generatedDescription, { shouldValidate: true });
                toast({ title: "Description generated!" });
            } else {
                throw new Error(result.error);
            }
        } catch (e) {
            toast({ title: "AI Assistant failed.", variant: "destructive" });
        } finally {
            setIsAiLoading(false);
        }
    };

    function onSubmit(values: z.infer<typeof formSchema>) {
        onNext(values);
    }
    
    return (
        <Form {...form}>
            <form id="step-3-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="taskTitle"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Task Title</FormLabel>
                            <FormControl><Input placeholder="e.g., Build a Login Form" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="taskDescription"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center justify-between">
                                <span>Task Description</span>
                                <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isAiLoading}>
                                     {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-primary" />}
                                     Generate with AI
                                </Button>
                            </FormLabel>
                            <FormControl>
                                <Textarea placeholder="Describe the task for your candidates." className="min-h-[150px]" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}
