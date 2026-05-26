'use client';

import React from 'react';
import { PageDefinition, PageSection } from '@/core/content/schemas';
import { COMPONENT_REGISTRY } from './ComponentRegistry';

interface PageRendererProps {
  page: PageDefinition;
}

export default function PageRenderer({ page }: PageRendererProps) {
  return (
    <>
      {page.sections.map((section: PageSection) => {
        const Component = COMPONENT_REGISTRY[section.type];
        
        if (!Component) {
          console.warn(`No component found for section type: ${section.type}`);
          return null;
        }

        // Pass any specific content or props from the schema.
        // The 'key' prop must be passed directly to JSX, not via spread.
        const { anchor, ...contentProps } = section.content || {};
        
        const componentProps = {
          id: anchor || section.id,
          ...contentProps
        };

        return <Component key={section.id} {...componentProps} />;
      })}
    </>
  );
}
