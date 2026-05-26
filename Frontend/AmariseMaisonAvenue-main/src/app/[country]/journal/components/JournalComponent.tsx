'use client';
import Link from 'next/link';
import { ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import React from 'react'

const JournalComponent = ({countryCode}:{countryCode: string}) => {
    const { editorials } = useAppStore();

    const filteredEditorials = editorials.filter(ed => ed.country === countryCode || ed.country === 'us');

    return (
        <div className="container mx-auto px-6 py-20 animate-fade-in">
            <div className="max-w-4xl mx-auto text-center space-y-8 mb-32">
                <nav className="flex items-center justify-center space-x-2 text-[10px] tracking-widest uppercase text-muted-foreground mb-8">
                    <Link href={`/${countryCode}`} className="hover:text-primary transition-colors">Home</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-foreground font-bold">The Journal</span>
                </nav>
                <div className="inline-flex items-center space-x-3 text-primary mb-4">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-[10px] font-bold tracking-[0.4em] uppercase">Maison Editorial</span>
                </div>
                <h1 className="text-7xl md:text-9xl font-headline font-bold italic">The Journal</h1>
                <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto italic">
                    "A testament to human excellence, exploring the artifacts, ateliers, and individuals who define contemporary luxury."
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                {filteredEditorials.map((ed, idx) => (
                    <Link
                        key={ed.id}
                        href={`/${countryCode}/journal/${ed.id}`}
                        className={`group space-y-8 block ${idx % 2 === 1 ? 'md:translate-y-20' : ''}`}
                    >
                        <div className="relative aspect-[16/9] overflow-hidden bg-muted border border-border/40 flex items-center justify-center">
                            {/* Journal Card Box Placeholder */}
                            <div className="text-[10px] font-bold tracking-[0.5em] text-gray-300 uppercase italic transition-transform duration-[2s] group-hover:scale-110">
                                Editorial Asset
                            </div>
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                            {ed.isVip && (
                                <div className="absolute top-6 left-6 bg-primary px-4 py-2 text-[10px] font-bold tracking-[0.2em] text-white uppercase shadow-2xl luxury-blur bg-opacity-80">
                                    Private Edition
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <span className="text-primary text-[10px] font-bold tracking-[0.3em] uppercase">{ed.category}</span>
                                <span className="w-8 h-px bg-border" />
                                <span className="text-muted-foreground text-[10px] uppercase tracking-widest">{ed.date}</span>
                            </div>
                            <h2 className="text-4xl font-headline font-bold group-hover:text-primary transition-colors duration-500">{ed.title}</h2>
                            <p className="text-muted-foreground font-light leading-relaxed italic">{ed.excerpt}</p>
                            <div className="pt-4 flex items-center text-[10px] font-bold tracking-[0.3em] uppercase group-hover:translate-x-4 transition-transform">
                                Read Narrative <ArrowRight className="ml-2 w-3 h-3" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {filteredEditorials.length === 0 && (
                <div className="text-center py-40 text-muted-foreground italic">
                    The journal is currently being prepared by our editors.
                </div>
            )}

            <div className="mt-60 pt-20 border-t border-border flex flex-col items-center space-y-12">
                <h3 className="text-3xl font-headline font-bold italic">Bespoke Storytelling</h3>
                <p className="text-muted-foreground max-w-xl text-center font-light leading-relaxed">
                    Receive our quarterly hard-bound edition, a physical archive of the Maison's most evocative narratives.
                </p>
                <Button variant="outline" className="rounded-none border-foreground h-16 px-12 text-[10px] font-bold tracking-[0.4em]">
                    SUBSCRIBE TO THE ARCHIVE
                </Button>
            </div>
        </div>
    );
}

export default JournalComponent