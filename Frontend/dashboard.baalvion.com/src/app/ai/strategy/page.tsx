'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ExpandPlanner from './components/expand-planner';
import AcquirePlanner from './components/acquire-planner';
import MergePlanner from './components/merge-planner';
import WindDownPlanner from './components/wind-down-planner';
import { TrendingUp, Landmark, Combine, XCircle } from 'lucide-react';

export default function StrategyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Strategic Planner</h1>
        <p className="text-muted-foreground">
          Model major strategic decisions and analyze their potential impact.
        </p>
      </div>

      <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Expand — Enter a New Market</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ExpandPlanner />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <Landmark className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Acquire — Acquire a Business</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <AcquirePlanner />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <Combine className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Merge — Merge Two Businesses</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <MergePlanner />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4">
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Close — Wind Down a Business</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <WindDownPlanner />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
