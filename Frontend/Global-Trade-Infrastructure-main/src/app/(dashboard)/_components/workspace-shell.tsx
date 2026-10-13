/**
 * @file workspace-shell.tsx
 * @description The content area of every signed-in page: open-page tabs, the page itself, and an
 * optional insights panel on wide screens.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/modules/workspace/store/workspace-store';
import { WorkspaceTabs } from './workspace-tabs';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, BrainCircuit } from 'lucide-react';
import { InsightsPanel } from './insights-panel';
import { PageHeadingFallback } from '@/components/dashboard/page-heading-fallback';

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const { 
    rightPanelOpen, 
    toggleRightPanel, 
    rightPanelWidth, 
    setRightPanelWidth,
    mode
  } = useWorkspaceStore();
  
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 320 && newWidth < 800) {
        setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => setIsResizing(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setRightPanelWidth]);

  return (
    <div className={cn(
      "flex-1 flex flex-col min-w-0 bg-background relative",
      (mode as any) === 'compact' ? "density-compact" : "density-standard"
    )}>
      {/* Open pages, as tabs. Hidden on phones, where there is no room for them. */}
      <WorkspaceTabs />

      <div className="flex-1 flex min-h-0">
        {/* The page itself: one scroll area and the target of the "skip to main content" link. Each page
            supplies its own <main> landmark. */}
        <div
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-w-0 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-24 focus:outline-none"
        >
          <PageHeadingFallback containerId="main-content" />
          {children}
        </div>

        {/* Drag handle for the side panel (desktops with a mouse only). */}
        {rightPanelOpen && (
          <div
            className={cn(
              "hidden xl:block w-1 group cursor-col-resize relative z-30 bg-border hover:bg-primary/40 transition-colors",
              isResizing && "bg-primary"
            )}
            onMouseDown={() => setIsResizing(true)}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize the insights panel"
          />
        )}

        {/* Insights: a side panel on wide screens only. Smaller screens have no room for it, so
            nothing is shown there (an earlier version showed a button that opened nothing). */}
        <AnimatePresence>
          {rightPanelOpen && (
            <motion.aside
              aria-label="Insights"
              initial={{ x: 420, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 420, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ width: rightPanelWidth }}
              className="hidden xl:flex flex-col bg-card border-l shrink-0 overflow-hidden relative"
            >
               <header className="h-14 border-b flex items-center justify-between px-5 shrink-0">
                  <div className="flex items-center gap-3">
                     <BrainCircuit aria-hidden className="h-5 w-5 text-primary" />
                     <span className="text-base font-semibold">Insights</span>
                  </div>
                  <button
                    type="button"
                    aria-label="Close insights"
                    className="h-11 w-11 flex items-center justify-center rounded-lg hover:bg-accent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                    onClick={() => toggleRightPanel(false)}
                  >
                    <ChevronRight aria-hidden className="h-5 w-5 text-muted-foreground" />
                  </button>
               </header>
               <div className="flex-1 overflow-y-auto">
                  <InsightsPanel />
               </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Button that opens the side panel: only where the panel can actually appear, and set
            above the assistant button so the two never overlap. */}
        {!rightPanelOpen && (
          <button
            type="button"
            aria-label="Open insights"
            className="hidden xl:flex fixed right-8 bottom-28 h-12 w-12 rounded-full shadow-lg z-40 bg-card border items-center justify-center hover:bg-accent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            onClick={() => toggleRightPanel(true)}
          >
            <BrainCircuit aria-hidden className="h-6 w-6 text-primary" />
          </button>
        )}
      </div>
    </div>
  );
}
