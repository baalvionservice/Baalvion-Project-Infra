import { Check, X } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const rows: Array<{ capability: string; legacy: string; baalvion: string }> = [
  { capability: "Raw articles", legacy: "Yes", baalvion: "AI intelligence" },
  { capability: "Trend detection", legacy: "No", baalvion: "Trend engine with velocity scoring" },
  { capability: "Entity graph", legacy: "No", baalvion: "Linked entity relationships" },
  { capability: "Search", legacy: "Basic keyword", baalvion: "Semantic search" },
  { capability: "Delivery speed", legacy: "Delayed insights", baalvion: "Real-time alerts, <60s" },
  { capability: "Output shape", legacy: "Article feed", baalvion: "Actionable intelligence" },
];

export function ComparisonTable() {
  return (
    <div className="glow-card rounded-xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Capability</TableHead>
            <TableHead>Traditional News APIs</TableHead>
            <TableHead>Baalvion Intelligence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.capability}>
              <TableCell className="font-medium text-foreground">{row.capability}</TableCell>
              <TableCell className="text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <X className="h-4 w-4 text-signal-negative" aria-hidden />
                  {row.legacy}
                </span>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-2 font-medium text-foreground">
                  <Check className="h-4 w-4 text-signal-positive" aria-hidden />
                  {row.baalvion}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
