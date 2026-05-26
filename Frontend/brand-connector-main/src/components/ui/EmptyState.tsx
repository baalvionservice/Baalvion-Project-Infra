'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  MessageSquare, 
  Users, 
  Search, 
  Bell, 
  Wallet, 
  AlertCircle, 
  Plus, 
  ArrowRight,
  RefreshCcw,
  Sparkles,
  Inbox
} from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export type EmptyStateType = 
  | 'CAMPAIGNS' 
  | 'APPLICATIONS' 
  | 'CREATORS' 
  | 'MESSAGES' 
  | 'TRANSACTIONS' 
  | 'NOTIFICATIONS' 
  | 'SEARCH' 
  | 'ERROR';

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

const CONFIG: Record<EmptyStateType, { 
  title: string; 
  description: string; 
  icon: any; 
  color: string; 
  bg: string;
  actionText?: string;
}> = {
  CAMPAIGNS: {
    title: "Ready to launch?",
    description: "Start your first campaign and connect with verified creators. Our AI is ready to find your perfect matches.",
    icon: Briefcase,
    color: "text-primary",
    bg: "bg-primary/5",
    actionText: "Create Campaign"
  },
  APPLICATIONS: {
    title: "Waiting for the magic...",
    description: "Your pitches will appear here. Try applying to some featured campaigns to kickstart your journey.",
    icon: Inbox,
    color: "text-orange-600",
    bg: "bg-orange-50",
    actionText: "Browse Campaigns"
  },
  CREATORS: {
    title: "The search continues...",
    description: "We couldn't find any creators matching these specific filters. Try broadening your criteria or niche.",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
    actionText: "Clear All Filters"
  },
  MESSAGES: {
    title: "Start the conversation",
    description: "Connect with brands and creators directly. Your collaboration threads and file shares will live here.",
    icon: MessageSquare,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    actionText: "Go to Inbox"
  },
  TRANSACTIONS: {
    title: "Wallet is empty (for now)",
    description: "Once you complete campaigns or fund escrow, your detailed financial history will appear here.",
    icon: Wallet,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    actionText: "Add Funds"
  },
  NOTIFICATIONS: {
    title: "All caught up!",
    description: "No new alerts in your inbox. We'll notify you when something important happens in your workspace.",
    icon: Bell,
    color: "text-slate-400",
    bg: "bg-slate-50"
  },
  SEARCH: {
    title: "No results found",
    description: "We couldn't find a match for your search. Check your spelling or try different keywords.",
    icon: Search,
    color: "text-slate-400",
    bg: "bg-slate-50",
    actionText: "Reset Search"
  },
  ERROR: {
    title: "Something went wrong",
    description: "We encountered a technical glitch while loading this data. Our team has been notified.",
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    actionText: "Retry Loading"
  }
};

export function EmptyState({ 
  type, 
  title, 
  description, 
  actionText, 
  onAction, 
  className 
}: EmptyStateProps) {
  const config = CONFIG[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-[3rem] border border-dashed border-slate-200",
        className
      )}
    >
      <div className={cn(
        "h-24 w-24 rounded-[2.5rem] flex items-center justify-center mb-8 relative group",
        config.bg
      )}>
        <Icon className={cn("h-10 w-10 transition-transform group-hover:scale-110 duration-500", config.color)} />
        <div className="absolute -top-2 -right-2">
          <Sparkles className="h-6 w-6 text-primary/20 animate-pulse" />
        </div>
      </div>

      <div className="max-w-sm space-y-3">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
          {title || config.title}
        </h3>
        <p className="text-slate-500 font-medium leading-relaxed">
          {description || config.description}
        </p>
      </div>

      {(actionText || config.actionText) && (
        <div className="mt-10">
          <Button 
            onClick={onAction}
            className="rounded-full px-10 h-14 text-lg font-black shadow-xl shadow-primary/20 group"
          >
            {actionText || config.actionText}
            {type === 'ERROR' ? (
              <RefreshCcw className="ml-2 h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
            ) : (
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
