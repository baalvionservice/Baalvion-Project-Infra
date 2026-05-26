
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HeroSection() {
    return (
        <section className="bg-background text-foreground py-12 md:py-20 lg:py-28">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Column */}
                    <div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                            <span className="text-primary">Investor</span>
                            <br />
                            Relations
                        </h1>
                        <p className="mt-4 max-w-md text-base sm:text-lg text-muted-foreground">
                            Latest information for interested parties of Baalvion stock.
                        </p>
                        <div className="mt-8 space-y-3">
                            <Link href="/dashboard" className="flex items-center text-sm font-semibold text-foreground hover:text-primary transition-colors group">
                                <span className="text-primary font-bold mr-3 group-hover:translate-x-1 transition-transform">{'>'}</span>
                                See our latest quarterly results
                            </Link>
                            <Link href="#press-releases" className="flex items-center text-sm font-semibold text-foreground hover:text-primary transition-colors group">
                                <span className="text-primary font-bold mr-3 group-hover:translate-x-1 transition-transform">{'>'}</span>
                                See our latest press releases
                            </Link>
                        </div>
                    </div>

                    {/* Right Column (Info Widget) */}
                    <div className="flex justify-start lg:justify-end">
                       <div className="border border-border p-6 rounded-lg w-full max-w-sm bg-background/50 backdrop-blur-sm shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-sm uppercase tracking-wider">Private Company (India)</h3>
                                <div className="h-3 w-3 bg-primary rounded-full animate-pulse"></div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">CIN:</span>
                                    <span className="font-mono text-[10px] sm:text-xs bg-muted px-2 py-1 rounded">U43121OD2025PTC048479</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Investor Access:</span>
                                    <span className="font-semibold text-right">Accredited Only</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Capital Structure:</span>
                                    <span className="font-semibold text-right">Privately Held</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Regulatory Status:</span>
                                    <span className="font-semibold text-right">Unlisted</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-16 md:mt-24 lg:mt-28 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    <div className="space-y-6">
                        <h2 className="text-2xl sm:text-3xl font-bold border-l-4 border-primary pl-4">Annual Report and Proxy</h2>
                        <div className="space-y-3">
                            <Button asChild variant="outline" className="w-full justify-between text-sm sm:text-base h-14 px-6 hover:border-primary group transition-all">
                                <Link href="#">
                                    2026 Annual Report <span className="text-primary font-bold group-hover:translate-x-1 transition-transform">{'>'}</span>
                                </Link>
                            </Button>
                             <Button asChild variant="outline" className="w-full justify-between text-sm sm:text-base h-14 px-6 hover:border-primary group transition-all">
                                <Link href="#">
                                    2025 Investor Day Materials <span className="text-primary font-bold group-hover:translate-x-1 transition-transform">{'>'}</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                     <div className="space-y-6">
                        <h2 className="text-2xl sm:text-3xl font-bold border-l-4 border-primary pl-4">2026 Investor Day</h2>
                        <div className="space-y-3">
                            <Button asChild variant="outline" className="w-full justify-between text-sm sm:text-base h-14 px-6 hover:border-primary group transition-all">
                                <Link href="#">
                                    Full presentation <span className="text-primary font-bold group-hover:translate-x-1 transition-transform">{'>'}</span>
                                </Link>
                            </Button>
                             <Button asChild variant="outline" className="w-full justify-between text-sm sm:text-base h-14 px-6 hover:border-primary group transition-all">
                                <Link href="#">
                                    Agenda <span className="text-primary font-bold group-hover:translate-x-1 transition-transform">{'>'}</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
