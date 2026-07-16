'use client';

import React, { useState, useMemo } from 'react';
import { KnowledgeGraphData, NodeSelectionState } from '@/types/knowledge-graph';
import { GraphVisualizer } from './GraphVisualizer';
import { NodeDetailPanel } from './NodeDetailPanel';
import { ExplorerSidebar } from './ExplorerSidebar';
import { Zap, Globe, Layers } from 'lucide-react';
import { Text } from '@/design-system/typography/text';
import { Card } from '@/components/ui/card';

interface KnowledgeGraphHubProps {
  /** Real graph data fetched server-side (see `/knowledge-map/page.tsx`). */
  initialData: KnowledgeGraphData;
}

/**
 * Main terminal for the Financial Knowledge Graph Engine.
 */
export function KnowledgeGraphHub({ initialData }: KnowledgeGraphHubProps) {
  const data = initialData;
  const [selection, setSelection] = useState<NodeSelectionState>({
    selectedNodeId: null,
    highlightedIds: []
  });

  const handleNodeClick = (id: string) => {
    // Find neighbors
    const neighbors = data.connections
      .filter(c => c.source === id || c.target === id)
      .map(c => c.source === id ? c.target : c.source);
    
    setSelection({
      selectedNodeId: id,
      highlightedIds: [id, ...neighbors]
    });
  };

  const selectedNode = useMemo(() =>
    data.nodes.find(n => n.id === selection.selectedNodeId) || null,
    [data, selection.selectedNodeId]
  );

  const relatedNodes = useMemo(() => {
    if (!selection.selectedNodeId) return [];
    return data.nodes.filter(n =>
      selection.highlightedIds.includes(n.id) && n.id !== selection.selectedNodeId
    );
  }, [data, selection]);

  if (data.nodes.length === 0) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4 text-center">
        <Layers className="h-12 w-12 text-muted-foreground" />
        <Text variant="bodySmall" className="font-bold tracking-widest uppercase text-muted-foreground">
          No indexed entities available yet
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* EXPLORER SIDEBAR */}
        <div className="lg:col-span-3">
          <ExplorerSidebar 
            nodes={data.nodes} 
            onNodeSelect={handleNodeClick}
            activeId={selection.selectedNodeId}
          />
        </div>

        {/* MAIN VISUALIZER */}
        <div className="lg:col-span-6 space-y-8">
          <header className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <Text variant="h3" className="font-bold">Knowledge Matrix</Text>
                <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">Interactive Intelligence Nodes</Text>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-[10px] font-bold h-7 px-4 uppercase tracking-tighter">
              All Nodes Synced
            </Badge>
          </header>

          <GraphVisualizer 
            nodes={data.nodes} 
            connections={data.connections} 
            selection={selection}
            onNodeClick={handleNodeClick}
          />

          <Card className="glass-card border-none bg-primary/5 p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Zap className="h-16 w-16 text-primary" />
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed italic block">
              "The Knowledge Graph maps the **Semantic DNA** of the Imperialpedia Index. Relationships are established through institutional cross-citations and shared thematic metadata."
            </Text>
          </Card>
        </div>

        {/* SELECTION PANEL */}
        <div className="lg:col-span-3">
          {selectedNode ? (
            <NodeDetailPanel 
              node={selectedNode} 
              relatedNodes={relatedNodes} 
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-[3rem] border-white/5 bg-card/10 text-center space-y-6 opacity-40">
              <div className="w-20 h-20 rounded-[2.5rem] bg-muted/20 flex items-center justify-center mx-auto shadow-inner">
                <Layers className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <Text variant="h4" className="font-bold uppercase tracking-widest text-xs">Awaiting node triage</Text>
                <Text variant="bodySmall" className="italic leading-relaxed">
                  Select a point on the matrix to audit its conceptual relationships and intelligence depth.
                </Text>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { Badge } from '@/components/ui/badge';
