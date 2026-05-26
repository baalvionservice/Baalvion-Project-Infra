'use client';

import React, { useMemo } from 'react';
import { GraphNode, GraphConnection, NodeSelectionState } from '@/types/knowledge-graph';
import { cn } from '@/lib/utils';
import { Text } from '@/design-system/typography/text';

interface GraphVisualizerProps {
  nodes: GraphNode[];
  connections: GraphConnection[];
  selection: NodeSelectionState;
  onNodeClick: (id: string) => void;
}

/**
 * Visual renderer for the Knowledge Graph Engine.
 * Uses a fixed grid-cluster layout for predictable prototype interaction.
 */
export function GraphVisualizer({ nodes, connections, selection, onNodeClick }: GraphVisualizerProps) {
  // Positioning logic for a static-looking graph in a grid
  const nodePositions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const categories = Array.from(new Set(nodes.map(n => n.category)));
    
    categories.forEach((cat, cIdx) => {
      const catNodes = nodes.filter(n => n.category === cat);
      const startX = 150 + (cIdx * 250);
      
      catNodes.forEach((node, nIdx) => {
        pos[node.id] = {
          x: startX + (nIdx % 2 === 0 ? 0 : 40),
          y: 100 + (nIdx * 120)
        };
      });
    });
    
    return pos;
  }, [nodes]);

  const activeLinks = connections.filter(c => 
    selection.highlightedIds.includes(c.source) || 
    selection.highlightedIds.includes(c.target)
  );

  return (
    <div className="relative w-full h-[700px] bg-card/20 rounded-[3rem] border border-white/5 overflow-hidden shadow-inner">
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(130, 114, 242, 0.2)" />
          </marker>
          <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(130, 114, 242, 0.8)" />
          </marker>
        </defs>

        {/* Links */}
        {connections.map((conn, i) => {
          const from = nodePositions[conn.source];
          const to = nodePositions[conn.target];
          const isActive = selection.highlightedIds.includes(conn.source) && selection.highlightedIds.includes(conn.target);
          
          if (!from || !to) return null;

          return (
            <line
              key={`${conn.source}-${conn.target}-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isActive ? "rgba(130, 114, 242, 0.8)" : "rgba(255, 255, 255, 0.05)"}
              strokeWidth={isActive ? 2 : 1}
              strokeDasharray={isActive ? "none" : "5,5"}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node) => {
        const pos = nodePositions[node.id];
        const isSelected = selection.selectedNodeId === node.id;
        const isHighlighted = selection.highlightedIds.includes(node.id);

        return (
          <div
            key={node.id}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 group z-20",
              isSelected ? "scale-110" : "hover:scale-105"
            )}
            style={{ left: pos.x, top: pos.y }}
            onClick={() => onNodeClick(node.id)}
          >
            <div className={cn(
              "w-4 h-4 rounded-full border-2 bg-background transition-all duration-500 shadow-[0_0_15px_rgba(0,0,0,0.5)]",
              isSelected ? "border-primary scale-150 shadow-[0_0_20px_rgba(130,114,242,0.5)]" : 
              isHighlighted ? "border-primary/60 scale-125" : "border-white/20 group-hover:border-primary/40"
            )} />
            
            <div className={cn(
              "absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-lg transition-all duration-500",
              isSelected ? "bg-primary text-white font-bold scale-110 shadow-lg" : 
              isHighlighted ? "bg-card/80 text-foreground scale-100" : "bg-card/40 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:bg-card/60"
            )}>
              <span className="text-[10px] uppercase tracking-widest">{node.label}</span>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-8 left-8 p-6 bg-card/50 backdrop-blur-md rounded-2xl border border-white/10 space-y-3 shadow-xl">
        <Text variant="label" className="text-[9px] opacity-50 mb-2 block">Taxonomy Nodes</Text>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <Text variant="caption" className="font-bold">Primary Intelligence</Text>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-secondary" />
          <Text variant="caption" className="font-bold">Market Hub</Text>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full border-2 border-white/20" />
          <Text variant="caption">Inactive Discovery</Text>
        </div>
      </div>
    </div>
  );
}
