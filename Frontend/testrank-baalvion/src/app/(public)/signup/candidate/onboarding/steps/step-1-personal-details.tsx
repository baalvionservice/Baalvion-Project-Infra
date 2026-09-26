
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { OnboardingData } from '../onboarding-flow';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
    profilePhoto: z
        .any()
        .refine((file) => !file || file?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
        .refine(
            (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file?.type),
            "Only .jpg, .jpeg, .png and .webp formats are supported."
        ).optional(),
    location: z.string().min(2, 'Location is required.'),
});

interface Step1Props {
    onNext: (data: Partial<OnboardingData>) => void;
    data: Partial<OnboardingData>;
}

export function Step1PersonalDetails({ onNext, data }: Step1Props) {
    const { toast } = useToast();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: data.fullName || '',
            location: data.location || '',
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        onNext({
            ...values,
            profilePhoto: values.profilePhoto?.[0]
        });
    }
    
    return (
        <Form {...form}>
            <form id="step-0-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl><Input placeholder="e.g., San Francisco, CA" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="profilePhoto"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                        <FormItem>
                            <FormLabel>Profile Photo</FormLabel>
                            <FormControl>
                                <Input type="file" accept="image/png, image/jpeg" onChange={(e) => onChange(e.target.files)} {...fieldProps} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}
