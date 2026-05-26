import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Sparkles } from 'lucide-react';

interface ResearchResultProps {
  summary: string;
}

export const ResearchResult = ({ summary }: ResearchResultProps) => {
  return (
    <Card className="glass-card border-none bg-primary/5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CardContent className="p-8">
        <div className="flex items-center gap-2 text-primary mb-4 font-bold uppercase text-[10px] tracking-widest">
          <Sparkles className="h-4 w-4" /> Analyst Synthesis
        </div>
        <Text variant="body" className="text-lg leading-relaxed italic text-foreground/90">
          "{summary}"
        </Text>
      </CardContent>
    </Card>
  );
};
