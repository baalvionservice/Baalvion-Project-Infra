import React from "react";
import { HomeSectionHeading } from "./HomeSectionHeading";
import { HowToUse } from "./HowToUse";
import { HowWeWork } from "./HowWeWork";

/**
 * Single "How It Works" section replacing what used to be two separate
 * full-width numbered-stepper sections (HowToUse and HowWeWork) sitting in
 * different parts of the page — same visual pattern (icon-in-circle,
 * numbered, connected steps) repeated twice read as redundant. Now one
 * heading, two columns: the reader's path on the left, the editorial
 * pipeline on the right, divided by a hairline on desktop.
 */
export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <HomeSectionHeading title="How It Works" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 lg:divide-x lg:divide-border">
        <HowToUse />
        <div className="lg:pl-16">
          <HowWeWork />
        </div>
      </div>
    </section>
  );
}
