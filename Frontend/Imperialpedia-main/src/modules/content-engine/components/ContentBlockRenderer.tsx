'use client';

import React from 'react';
import Image from 'next/image';
import { Text } from '@/design-system/typography/text';
import { ContentBlock } from '../types';
import { cn } from '@/lib/utils';
import { slugify } from '../utils/slugify';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface ContentBlockRendererProps {
  block: ContentBlock;
}

/**
 * Renders individual content blocks based on their type.
 * Supports paragraphs, headings, lists, quotes, images, and tables.
 */
export const ContentBlockRenderer = ({ block }: ContentBlockRendererProps) => {
  const { type, content, metadata } = block;

  switch (type) {
    case 'heading': {
      const level = metadata?.level || 2;
      const variant = `h${level}` as any;
      const id = slugify(content as string);
      
      return (
        <Text 
          variant={variant} 
          as={variant} 
          id={id}
          className="mt-8 mb-4 scroll-mt-24"
        >
          {content}
        </Text>
      );
    }

    case 'paragraph':
      return (
        <Text variant="body" className="mb-4 leading-relaxed text-foreground/90">
          {content}
        </Text>
      );

    case 'list': {
      const Component = metadata?.isOrdered ? 'ol' : 'ul';
      return (
        <Component className={cn(
          "mb-6 ml-6 space-y-2",
          metadata?.isOrdered ? "list-decimal" : "list-disc"
        )}>
          {(content as string[]).map((item, idx) => (
            <li key={idx}>
              <Text variant="body" as="span">{item}</Text>
            </li>
          ))}
        </Component>
      );
    }

    case 'quote':
      return (
        <blockquote className="border-l-4 border-primary pl-6 py-2 my-8 italic bg-muted/30 rounded-r-lg">
          <Text variant="h4" className="mb-2 text-primary/90 font-medium">
            "{content}"
          </Text>
          {metadata?.caption && (
            <cite className="text-sm text-muted-foreground not-italic block mt-2">
              — {metadata.caption}
            </cite>
          )}
        </blockquote>
      );

    case 'image':
      return (
        <figure className="my-10 space-y-3">
          <div className="relative aspect-video rounded-xl overflow-hidden border">
            <Image
              src={content}
              alt={metadata?.altText || 'Article image'}
              fill
              className="object-cover"
            />
          </div>
          {metadata?.caption && (
            <figcaption className="text-center text-sm text-muted-foreground italic">
              {metadata.caption}
            </figcaption>
          )}
        </figure>
      );

    case 'table': {
      const { headers, rows } = content as { headers: string[], rows: string[][] };
      return (
        <div className="my-8 rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header, i) => (
                  <TableHead key={i} className="bg-muted/50 font-bold">{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => (
                    <TableCell key={j}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    case 'callout':
      return (
        <div className={cn(
          "p-6 my-8 rounded-xl border-l-4",
          metadata?.variant === 'warning' ? "bg-amber-500/10 border-amber-500 text-amber-200" :
          metadata?.variant === 'error' ? "bg-destructive/10 border-destructive text-destructive-foreground" :
          metadata?.variant === 'success' ? "bg-emerald-500/10 border-emerald-500 text-emerald-200" :
          "bg-primary/10 border-primary text-primary-foreground"
        )}>
          <Text variant="body" className="font-medium">
            {content}
          </Text>
        </div>
      );

    default:
      return null;
  }
};
