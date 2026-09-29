'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ComplianceRecord } from '@/lib/types';
import { Check, AlertTriangle, ListChecks } from 'lucide-react';

interface ComplianceDetailModalProps {
  record: ComplianceRecord | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function ComplianceDetailModal({ record, isOpen, onOpenChange }: ComplianceDetailModalProps) {
    if (!record) return null;

    const details = [
        { label: 'Tax Status', value: record.taxStatus, status: record.taxStatusCode },
        { label: 'VAT/GST', value: record.vatGst, status: 'ok' },
        { label: 'Local Licenses', value: record.licenses, status: record.licenses === 'Valid' ? 'ok' : 'warning' },
        { label: 'Data Laws', value: record.dataLaws, status: record.dataLaws.includes('Review') ? 'warning' : 'ok' },
        { label: 'Employment Law', value: record.employmentLaw, status: record.employmentLaw === 'Compliant' ? 'ok' : 'warning' },
    ];

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-2xl">
                        <span className="text-3xl">{record.flag}</span>
                        {record.country} Compliance Details
                    </SheetTitle>
                    <SheetDescription>
                        A detailed breakdown for {record.business}.
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                    {details.map(detail => (
                        <Card key={detail.label} className={detail.status === 'warning' ? 'border-orange-300' : ''}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">{detail.label}</CardTitle>
                                {detail.status === 'ok' ? 
                                    <Check className="h-4 w-4 text-green-500" /> : 
                                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                                }
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-bold">{detail.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-md">
                                <ListChecks className="h-5 w-5" /> Action Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                                {record.actionItems.map((item, index) => <li key={index}>{item}</li>)}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </SheetContent>
        </Sheet>
    );
}
