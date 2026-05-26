"use client";

import FaqItem from "@/components/common/FaqItem";
import {
  Accordion as UIAccordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { accordionType } from "@/lib/data/terms";
import TermsFaqItem from "./TermsFaq";

export function Accordion({
  title,
  children,
}: {
  title: string;
  children: accordionType[];
}) {
  return (
    <div className="my-6">
      <UIAccordion type="single" collapsible className="w-full">
        <AccordionItem
          value="item-1"
          className="border border-black dark:border-white rounded-lg px-4"
        >
          <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-4">
            <div className="flex flex-col justify-start">
              <p className="text-lg font-semibold">Part of the Series</p>
              <h3 className="text-xl font-semibold" >{title}</h3>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-3">
              {children.map((con, i) => (
                <TermsFaqItem key={i} question={con.question} answer={con.answer} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </UIAccordion>
    </div>
  );
}
