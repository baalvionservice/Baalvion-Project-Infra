'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color?: string;
  bgColor?: string;
  index?: number;
}

/**
 * Enhanced Feature Card Component.
 * Features scroll-triggered entry animations and interactive hover scaling.
 * Optimized for screen readers with semantic roles.
 */
export const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  color = "text-primary", 
  bgColor = "bg-primary/10",
  index = 0
}: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="h-full"
    >
      <Card 
        className={cn(
          "glass-card border-none shadow-xl hover:border-primary/20 transition-all duration-500 group overflow-hidden h-full",
        )}
      >
        <CardContent className="p-8 space-y-6">
          <div 
            className={cn(
              "p-4 rounded-2xl w-fit transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner", 
              bgColor, 
              color
            )}
            aria-hidden="true"
          >
            <Icon size={28} />
          </div>
          
          <div className="space-y-3">
            <Text variant="h3" className="text-xl font-bold group-hover:text-primary transition-colors duration-300">
              {title}
            </Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">
              {description}
            </Text>
          </div>

          {/* TODO: AI-driven feature description generation */}
          {/* TODO: Dynamic icons and animations based on user behavior */}
        </CardContent>
        
        {/* Decorative gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" aria-hidden="true" />
      </Card>
    </motion.div>
  );
};
