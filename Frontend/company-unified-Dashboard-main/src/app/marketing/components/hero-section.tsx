'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <>
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="container mx-auto px-4">
            <div className="text-center">
                <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">The World's First Global Business Operating System</h1>
                <p className="mt-4 text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
                    Manage all your businesses, employees, finances, and equity — across every country — from one intelligent dashboard.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <Link href="/dashboard">
                        <Button size="lg">Start Free Trial</Button>
                    </Link>
                    <Link href="/marketing/demo">
                        <Button size="lg" variant="outline">Book a Demo</Button>
                    </Link>
                </div>
                <div className="mt-6 flex justify-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-500" />SOC 2 Compliant</div>
                    <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-500" />GDPR Ready</div>
                    <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-500" />256-bit Encryption</div>
                </div>
            </div>

            <div className="mt-16">
                <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[8px] rounded-t-xl w-full max-w-5xl h-[300px] md:h-[500px]">
                    <div className="rounded-xl overflow-hidden h-full bg-white dark:bg-black">
                        <Image
                            src="https://picsum.photos/seed/dashboard-screenshot/1200/800"
                            alt="Baalvion Dashboard"
                            fill
                            className="object-cover object-top"
                            data-ai-hint="dashboard ui"
                        />
                    </div>
                </div>
            </div>
        </div>
    </section>
    </>
  );
}
