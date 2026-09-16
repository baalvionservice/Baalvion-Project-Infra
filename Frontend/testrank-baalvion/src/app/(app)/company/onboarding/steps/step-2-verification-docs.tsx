'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { OnboardingData } from '../onboarding-flow';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useMemo } from 'react';

// Define document requirements per country
const documentRequirements: Record<string, { id: string; name: string }[]> = {
    'India': [
        { id: 'incorporation_cert', name: 'Certificate of Incorporation' },
        { id: 'pan_card', name: 'Company PAN Card' },
        { id: 'gst_cert', name: 'GST Certificate' },
        { id: 'bank_statement', name: 'Bank Account Statement (Last 3 Months)' },
        { id: 'director_kyc', name: 'Director\'s KYC (Aadhaar/Passport)' },
    ],
    'United States': [
        { id: 'articles_org', name: 'Articles of Organization/Incorporation' },
        { id: 'ein_letter', name: 'EIN Confirmation Letter (Form SS-4)' },
        { id: 'business_license', name: 'State/City Business License' },
    ],
    'United Kingdom': [
        { id: 'incorporation_cert', name: 'Certificate of Incorporation' },
        { id: 'proof_of_address', name: 'Proof of Business Address' },
        { id: 'director_id', name: 'Director\'s Identification' },
    ],
    'Germany': [
        { id: 'handelsregisterauszug', name: 'Handelsregisterauszug (Commercial Register Extract)' },
        { id: 'gewerbeanmeldung', name: 'Gewerbeanmeldung (Trade Registration)' },
        { id: 'steuernummer', name: 'Steuernummer (Tax Number Certificate)' },
    ],
    'Canada': [
        { id: 'articles_inc', name: 'Articles of Incorporation' },
        { id: 'business_number', name: 'Business Number (BN) Registration' },
        { id: 'provincial_license', name: 'Provincial/Territorial Business License' },
    ],
    'Default': [
         { id: 'business_registration', name: 'Business Registration Document' },
         { id: 'tax_id_document', name: 'Tax Identification Document' },
    ]
};

const fileSchema = z.any().refine(file => file?.length == 1, 'File is required.');

interface Step2Props {
    onNext: (data: Partial<OnboardingData>) => void;
    data: Partial<OnboardingData>;
}

export function Step2VerificationDocs({ onNext, data }: Step2Props) {
    const requiredDocs = useMemo(() => documentRequirements[data.country || 'Default'] || documentRequirements['Default'], [data.country]);

    // Dynamically create schema based on required docs
    const dynamicSchema = useMemo(() => z.object({
        documents: z.object(
            requiredDocs.reduce((acc, doc) => {
                acc[doc.id] = fileSchema;
                return acc;
            }, {} as Record<string, z.ZodTypeAny>)
        )
    }), [requiredDocs]);

    const form = useForm<z.infer<typeof dynamicSchema>>({
        resolver: zodResolver(dynamicSchema),
    });

    function onSubmit(values: z.infer<typeof dynamicSchema>) {
        const fileData = Object.entries(values.documents).reduce((acc, [key, fileList]) => {
            acc[key] = (fileList as FileList)[0];
            return acc;
        }, {} as Record<string, File>);
        
        onNext({ documents: fileData });
    }
    
    return (
        <Form {...form}>
            <form id="step-1-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <p className="text-sm text-muted-foreground">
                    Based on your selected country ({data.country}), please upload the following documents.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {requiredDocs.map(doc => (
                         <FormField
                            key={doc.id}
                            control={form.control}
                            name={`documents.${doc.id}`}
                            render={({ field: { onChange, value, ...rest } }) => (
                                <FormItem>
                                    <FormLabel>{doc.name}</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="file" 
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => onChange(e.target.files)}
                                            {...rest}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}
                </div>
            </form>
        </Form>
    )
}
