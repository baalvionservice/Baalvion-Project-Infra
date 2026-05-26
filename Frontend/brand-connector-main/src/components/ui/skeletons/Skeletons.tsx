'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function SkeletonCreatorCard() {
  return (
    <div className="rounded-[2.5rem] bg-white border border-slate-100 p-6 space-y-6 overflow-hidden">
      <div className="flex justify-between items-start">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-1/4 rounded-lg" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonCampaignCard() {
  return (
    <div className="rounded-[2.5rem] bg-white border border-slate-100 p-8 space-y-6">
      <div className="flex justify-between items-start">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-7 w-full rounded-lg" />
        <Skeleton className="h-4 w-1/3 rounded-lg" />
      </div>
      <div className="space-y-3">
        <div className="flex justify-between"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-12" /></div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4">
        <Skeleton className="h-12 rounded-2xl" />
        <Skeleton className="h-12 rounded-2xl" />
      </div>
    </div>
  );
}

export function SkeletonDashboardStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="p-6 rounded-[2rem] bg-white border border-slate-100 space-y-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChartArea() {
  return (
    <div className="rounded-[2.5rem] bg-white border border-slate-100 overflow-hidden">
      <div className="p-8 border-b bg-slate-50/50 flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="p-8 space-y-6">
        <Skeleton className="h-[300px] w-full rounded-2xl" />
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-3 w-12" />)}
        </div>
      </div>
    </div>
  );
}

export function SkeletonTableRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 h-16 border-b border-slate-50 last:border-0 px-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 rounded" />
            <Skeleton className="h-3 w-1/4 rounded" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfileHeader() {
  return (
    <div className="h-[300px] bg-slate-100 relative">
      <div className="container h-full flex items-end pb-8">
        <div className="flex gap-6 items-end w-full">
          <Skeleton className="h-32 w-32 md:h-40 md:w-40 rounded-3xl border-4 border-white shadow-xl" />
          <div className="flex-1 space-y-4 mb-4">
            <Skeleton className="h-10 w-1/2 rounded-xl" />
            <div className="flex gap-4">
              <Skeleton className="h-5 w-24 rounded-lg" />
              <Skeleton className="h-5 w-24 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-3 mb-4">
            <Skeleton className="h-12 w-32 rounded-xl" />
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonNotificationItem() {
  return (
    <div className="p-6 flex items-start gap-5 border-b border-slate-50">
      <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-6 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonChatMessage() {
  return (
    <div className="space-y-8 p-4">
      <div className="flex items-end gap-3">
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
        <Skeleton className="h-16 w-64 rounded-3xl rounded-bl-none" />
      </div>
      <div className="flex items-end gap-3 flex-row-reverse">
        <Skeleton className="h-16 w-48 rounded-3xl rounded-br-none bg-primary/10" />
      </div>
      <div className="flex items-end gap-3">
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
        <Skeleton className="h-20 w-72 rounded-3xl rounded-bl-none" />
      </div>
    </div>
  );
}
