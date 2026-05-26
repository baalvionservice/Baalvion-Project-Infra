'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function QuickLinksSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const quickLinks = [
    { name: "Investor Performance & Financial Reports", href: "/data-room" },
    { name: "Capital Returns & Payouts", href: "/dashboard" },
    { name: "Governance & Strategic Updates", href: "/#governance" },
  ];

  return (
    <section>
      <div className="bg-primary text-foreground">
        <div className="container mx-auto px-4 py-4 md:py-5">
            <div className="flex flex-col md:flex-row md:items-center md:gap-8">
                <h2 className="text-xl font-bold shrink-0 mb-4 md:mb-0">Quick Links</h2>
                <div className="grid md:grid-cols-3 gap-x-8 gap-y-4 w-full">
                {quickLinks.map((link) => (
                    <Link key={link.name} href={link.href} className="flex items-center text-sm font-semibold hover:underline">
                        <span className="mr-2 text-foreground/80">&gt;</span> {link.name}
                    </Link>
                ))}
                </div>
            </div>
        </div>
      </div>
      <div className="bg-black py-12 md:py-16">
        <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                <h2 className="text-3xl font-bold text-primary text-center md:text-left">Email Alerts</h2>
                {mounted ? (
                  <form className="flex w-full max-w-md items-center gap-4" suppressHydrationWarning>
                      <div className="w-full">
                          <label htmlFor="email-alert" className="sr-only">Your Email</label>
                          <Input 
                              id="email-alert"
                              type="email" 
                              placeholder="Your Email" 
                              className="w-full bg-transparent border-0 border-b border-gray-500 rounded-none px-0 py-2 text-white ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary placeholder:text-gray-400"
                              suppressHydrationWarning
                          />
                      </div>
                      <Button type="submit" className="bg-white text-black hover:bg-gray-200 rounded-sm whitespace-nowrap px-6 py-2">
                          Sign up <span className="ml-2">&gt;</span>
                      </Button>
                  </form>
                ) : (
                  <div className="w-full max-w-md h-12 bg-white/5 animate-pulse rounded" />
                )}
            </div>
        </div>
      </div>
    </section>
  );
}
