'use client';

import React from 'react';
import { VersionMetadata as MetadataType } from '@/types/version-control';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  Zap, 
  Award, 
  Sparkles,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VersionMetadataProps {
  metadata: MetadataType;
  version: string;
}

/**
 * Displays statistical vitals for a specific content version.
 */
export function VersionMetadata({ metadata, version }: VersionMetadataProps) {
  return (
    <Card className="glass-card border-none bg-card/30 shadow-xl overflow-hidden h-full">
      <CardContent className="p-8 space-y-8">
        <div className="space-y-1">
          <Text variant="label" className="text-[10px] opacity-50 uppercase font-bold tracking-widest text-primary">Snapshot Statistics</Text>
          <div className="text-3xl font-bold tracking-tighter">Version {version}</div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Words</span>
            </div>
            <div className="text-xl font-bold font-mono">{metadata.wordCount}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Depth</span>
            </div>
            <div className="text-xl font-bold font-mono">{metadata.readingTime}m</div>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-white/5">
          <div className="flex justify-between items-center">
            <Text variant="label" className="text-[9px] font-bold text-muted-foreground uppercase">Quality Score</Text>
            <span className="text-lg font-bold text-primary font-mono">{metadata.qualityScore}%</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${metadata.qualityScore}%` }} />
          </div>
        </div>

        <div className="space-y-3">
          <Text variant="label" className="text-[9px] font-bold text-muted-foreground uppercase">Trust Badges</Text>
          <div className="flex flex-wrap gap-2">
            {metadata.badges.map(badge => (
              <Badge key={badge} variant="outline" className="text-[8px] font-bold border-primary/20 bg-primary/5 text-primary uppercase h-5 px-2">
                {badge}
              </Badge>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <Text variant="caption" className="text-muted-foreground leading-relaxed italic">
              "This version node was cryptographically sealed after the Q2 2025 editorial audit cycle."
            </Text>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
