'use client';

import React from 'react';
import { BaseCard } from './BaseCard';
import { cn } from '@/lib/utils';
import { Clock, ChevronRight } from 'lucide-react';

interface NotificationCardProps {
  title: string;
  message: string;
  time: string;
  icon: any;
  isRead?: boolean;
  className?: string;
  onClick?: () => void;
}

export function NotificationCard({
  title,
  message,
  time,
  icon: Icon,
  isRead,
  className,
  onClick
}: NotificationCardProps) {
  return (
    <BaseCard 
      className={cn(
        "cursor-pointer group",
        !isRead ? "bg-white ring-1 ring-primary/10 shadow-md" : "bg-white/60 opacity-80 shadow-sm",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6 flex items-start gap-5">
        <div className={cn(
          "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-slate-50 transition-transform group-hover:scale-110",
          !isRead ? "bg-primary/5 text-primary" : "bg-slate-50 text-slate-400"
        )}>
          <Icon className="h-6 w-6" />
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-4">
            <h3 className={cn(
              "text-lg truncate tracking-tight",
              !isRead ? "font-black text-slate-900" : "font-bold text-slate-600"
            )}>
              {title}
            </h3>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {time}
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">
            {message}
          </p>
          
          <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[9px] font-black text-primary uppercase tracking-widest">Open Details</span>
            <ChevronRight className="h-3 w-3 text-primary" />
          </div>
        </div>
        
        {!isRead && (
          <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0 animate-pulse" />
        )}
      </CardContent>
    </BaseCard>
  );
}

// Internal ShadCN helper since we're using their CardContent styling
function CardContent({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}
