import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Zap } from 'lucide-react';

interface AIInsightCardProps {
  title: string;
  insight: string;
}

export const AIInsightCard = ({ title, insight }: AIInsightCardProps) => {
  return (
    <Card className="glass-card border-secondary/20 bg-secondary/5">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-widest mb-3">
          <Zap className="h-4 w-4" /> {title}
        </div>
        <Text variant="caption" className="text-muted-foreground leading-relaxed">
          {insight}
        </Text>
      </CardContent>
    </Card>
  );
};
