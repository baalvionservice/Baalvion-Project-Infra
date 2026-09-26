import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Section } from '@/components/ui/Section';

interface DataTableProps {
  title: string;
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
}

/**
 * Key Data table for entity technical attributes.
 */
export const DataTable = ({ title, headers, rows }: DataTableProps) => {
  return (
    <Section title={title} className="animate-in fade-in duration-1000 delay-300">
      <div className="rounded-[2rem] border border-white/5 overflow-hidden bg-card/30 shadow-2xl">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow className="border-b border-white/5 hover:bg-transparent">
              {headers.map((h) => (
                <TableHead key={h} className="text-[10px] uppercase font-bold tracking-widest py-6 px-8 text-muted-foreground">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i} className="border-b border-white/5 last:border-none hover:bg-white/5 transition-colors">
                {row.map((cell, j) => (
                  <TableCell key={j} className="py-6 px-8 font-medium text-foreground/80">{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Section>
  );
};
