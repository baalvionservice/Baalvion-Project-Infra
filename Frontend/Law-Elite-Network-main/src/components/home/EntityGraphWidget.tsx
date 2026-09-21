"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { GitFork, Link2, User, Gavel, Film, ArrowRight } from 'lucide-react';

export interface GraphNode {
  id: string;
  name: string;
  slug: string;
  category: string;
  connections: { targetName: string; targetSlug: string; relationship: string }[];
}

const GRAPH_NODES: GraphNode[] = [
  {
    id: 'node-trump',
    name: 'Donald Trump',
    slug: 'donald-trump',
    category: 'Public Figure / 47th President',
    connections: [
      { targetName: 'Jack Smith', targetSlug: 'jack-smith', relationship: 'Special Counsel Prosecution' },
      { targetName: 'Sonia Sotomayor', targetSlug: 'sonia-sotomayor', relationship: 'SCOTUS Immunity Dissent' },
      { targetName: 'Clarence Thomas', targetSlug: 'clarence-thomas', relationship: 'SCOTUS Immunity Majority' },
      { targetName: 'Fani Willis', targetSlug: 'fani-willis', relationship: 'Fulton County RICO Indictment' },
    ],
  },
  {
    id: 'node-musk',
    name: 'Elon Musk',
    slug: 'elon-musk',
    category: 'Tech Executive / CEO',
    connections: [
      { targetName: 'Delaware Court of Chancery', targetSlug: 'legal-dispute', relationship: 'Executive Compensation Rescission' },
      { targetName: 'U.S. SEC', targetSlug: 'corporate-governance', relationship: 'Regulatory Filings & Consent Decrees' },
    ],
  },
  {
    id: 'node-swift',
    name: 'Taylor Swift',
    slug: 'taylor-swift',
    category: 'Artist & Music Executive',
    connections: [
      { targetName: 'Master Recordings IP', targetSlug: 'intellectual-property', relationship: 'Copyright Re-Recording Precedent' },
      { targetName: 'Republic Records', targetSlug: 'commercial-law', relationship: 'Master Ownership License' },
    ],
  },
];

export function EntityGraphWidget() {
  const [selectedNode, setSelectedNode] = useState<GraphNode>(GRAPH_NODES[0]);

  return (
    <section className="py-8 bg-slate-900 border-2 border-slate-900 text-white p-6 rounded-sm my-8 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="bg-[#E13131] text-white p-2 rounded-sm shadow-sm">
            <GitFork className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E13131] block">
              PAGE SIX SIX-DEGREES
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none mt-1">
              INTERACTIVE ENTITY &amp; CASE CONNECTION GRAPH
            </h2>
          </div>
        </div>
        <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-sm uppercase tracking-wider">
          Content-Driven Network Relevance
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Node Selector */}
        <div className="lg:col-span-4 space-y-2">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Select Entity Hub:</p>
          {GRAPH_NODES.map((node) => {
            const isSelected = selectedNode.id === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`w-full text-left p-4 rounded-sm border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#E13131] border-[#E13131] text-white font-bold shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div>
                  <h3 className="font-serif text-lg font-black leading-tight">{node.name}</h3>
                  <p className={`text-[11px] uppercase tracking-wider ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                    {node.category}
                  </p>
                </div>
                <ArrowRight className={`w-4 h-4 ${isSelected ? 'opacity-100' : 'opacity-40'}`} />
              </button>
            );
          })}
        </div>

        {/* Right: Active Network Connections */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 p-6 rounded-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#E13131]">CONNECTED NETWORK FOR</span>
              <h3 className="font-serif text-2xl font-black text-white">{selectedNode.name}</h3>
            </div>
            <Link
              href={`/people/${selectedNode.slug}`}
              className="text-[11px] font-black uppercase tracking-wider text-[#E13131] bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-sm transition-colors border border-slate-700"
            >
              Full Profile Hub →
            </Link>
          </div>

          <div className="space-y-3">
            {selectedNode.connections.map((conn, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-900 border border-slate-800 rounded-sm hover:border-[#E13131] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-slate-800 text-[#E13131] flex items-center justify-center font-bold text-xs shrink-0">
                    <Link2 className="w-4 h-4" />
                  </span>
                  <div>
                    <Link href={`/people/${conn.targetSlug}`} className="font-serif text-base font-bold text-white hover:text-[#E13131] transition-colors">
                      {conn.targetName}
                    </Link>
                    <p className="text-[12px] text-slate-400 font-medium">{conn.relationship}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-slate-800 text-[#E13131] px-2.5 py-1 rounded-xs self-start sm:self-auto">
                  VERIFIED CONNECTION
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
