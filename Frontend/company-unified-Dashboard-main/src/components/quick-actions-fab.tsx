'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus, FilePlus, BellRing, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const actions = [
    { icon: UserPlus, label: 'Add Employee' },
    { icon: FilePlus, label: 'Add Transaction' },
    { icon: BellRing, label: 'View Alerts' },
    { icon: FileText, label: 'Generate Report' },
]

export default function QuickActionsFAB() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-24 right-6 z-50 md:hidden">
             <TooltipProvider>
                <div className="relative flex flex-col items-center gap-2">
                    {isOpen && (
                         <div className="flex flex-col gap-2 animate-in fade-in-0 slide-in-from-bottom-5">
                            {actions.map((action) => (
                                <Tooltip key={action.label}>
                                    <TooltipTrigger asChild>
                                        <Button variant="secondary" size="icon" className="rounded-full w-12 h-12 shadow-md">
                                            <action.icon className="h-6 w-6" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                        <p>{action.label}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    )}
                     <Button 
                        size="icon" 
                        className="rounded-full w-16 h-16 shadow-lg"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <Plus className={cn("h-8 w-8 transition-transform", isOpen && "rotate-45")} />
                    </Button>
                </div>
            </TooltipProvider>
        </div>
    );
}
