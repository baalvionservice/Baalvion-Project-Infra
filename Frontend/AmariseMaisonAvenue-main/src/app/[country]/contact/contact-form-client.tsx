'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Send,
    MapPin,
    Phone,
    Mail,
    Clock,
    Sparkles,
    Globe
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { COUNTRIES } from '@/lib/mock-data';
import Link from 'next/link';

type Country = {
    code: string;
    name: string;
    office?: {
        city: string;
        address: string;
        phone: string;
        email: string;
        mapUrl: string;
    };
};

interface ContactFormClientProps {
    countryCode: string;
    currentCountry: Country;
}

export function ContactFormClient({ countryCode, currentCountry }: ContactFormClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        setTimeout(() => {
            setIsSubmitting(false);
            toast({
                title: "Request Sent",
                description: "A Maison Concierge will contact you within 24 business hours.",
            });
        }, 1500);
    };

    const handleCountrySwitch = (code: string) => {
        router.push(`/${code}/contact`);
    };

    return (
        <>
            {/* Contact Form Section */}
            <div className="flex-1 space-y-12">
                <div className="space-y-4">
                    <h2 className="text-4xl font-headline font-bold italic">Speak with the Maison</h2>
                    <p className="text-lg text-muted-foreground font-light leading-relaxed italic max-w-xl">
                        "Our concierge team is at your disposal for bespoke requests, private appointments, and heritage inquiries."
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 bg-white p-10 shadow-luxury border border-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Your Name</Label>
                            <Input required className="rounded-none bg-ivory/50 border-border focus:ring-gold" placeholder="Julian Vandervilt" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Email Address</Label>
                            <Input required type="email" className="rounded-none bg-ivory/50 border-border focus:ring-gold" placeholder="j.vandervilt@lux.net" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Market Inquiry</Label>
                        <Select value={countryCode} onValueChange={handleCountrySwitch}>
                            <SelectTrigger className="rounded-none bg-ivory/50 border-border h-12">
                                <SelectValue placeholder="Select Country" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-border shadow-luxury">
                                {Object.values(COUNTRIES).map((c) => (
                                    <SelectItem key={c.code} value={c.code} className="text-[10px] font-bold uppercase tracking-widest">
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Inquiry Type</Label>
                        <Select defaultValue="bespoke">
                            <SelectTrigger className="rounded-none bg-ivory/50 border-border h-12">
                                <SelectValue placeholder="Reason for Contact" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-border shadow-luxury">
                                <SelectItem value="bespoke" className="text-[10px] font-bold uppercase tracking-widest">Bespoke Commission</SelectItem>
                                <SelectItem value="salon" className="text-[10px] font-bold uppercase tracking-widest">Private Salon Appointment</SelectItem>
                                <SelectItem value="order" className="text-[10px] font-bold uppercase tracking-widest">Order Support</SelectItem>
                                <SelectItem value="press" className="text-[10px] font-bold uppercase tracking-widest">Press & Media</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Your Message</Label>
                        <Textarea required className="rounded-none bg-ivory/50 border-border min-h-[150px] focus:ring-gold" placeholder="How may the Maison assist you?" />
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-16 bg-plum text-white hover:bg-gold hover:text-gray-900 rounded-none text-[10px] tracking-[0.4em] font-bold transition-all shadow-xl shadow-plum/10"
                    >
                        {isSubmitting ? "TRANSMITTING..." : "SEND MESSAGE"} <Send className="w-4 h-4 ml-3" />
                    </Button>
                </form>
            </div>

            {/* Sidebar with HQ Info */}
            <aside className="lg:w-96 mx-auto space-y-12 shrink-0">
                <div className="space-y-8 bg-white p-10 border border-border shadow-luxury animate-fade-in" key={countryCode}>
                    <div className="flex items-center space-x-4 text-plum">
                        <Globe className="w-5 h-5" />
                        <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase">Regional Headquarters</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h4 className="text-3xl font-headline font-bold italic text-gray-900">{currentCountry.office?.city} Ateliers</h4>
                            <div className="h-px w-12 bg-gold" />
                        </div>

                        <div className="space-y-6">
                            <ContactItem icon={<MapPin className="w-4 h-4 text-gold" />} label="Address" value={currentCountry.office?.address || ''} />
                            <ContactItem icon={<Phone className="w-4 h-4 text-gold" />} label="Telephone" value={currentCountry.office?.phone || ''} />
                            <ContactItem icon={<Mail className="w-4 h-4 text-gold" />} label="Email" value={currentCountry.office?.email || ''} />
                            <ContactItem icon={<Clock className="w-4 h-4 text-gold" />} label="Hours" value="Mon - Sat | 10:00 AM - 07:00 PM" />
                        </div>
                    </div>

                    <div className="pt-8">
                        <Link href={currentCountry.office?.mapUrl || '#'} target="_blank">
                            <Button variant="outline" className="w-full rounded-none border-border hover:bg-ivory text-[10px] font-bold tracking-[0.3em] uppercase h-12">
                                REQUEST DIRECTIONS
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Map Simulation Card Box */}
                <div className="relative aspect-[4/5] w-full border border-border shadow-luxury group overflow-hidden bg-muted flex items-center justify-center" key={`map-${countryCode}`}>
                    {/* HQ Card Box Placeholder */}
                    <div className="text-[10px] font-bold tracking-[0.5em] text-gray-300 uppercase transition-transform duration-[2s] group-hover:scale-105">
                        Atelier Location
                    </div>
                    <div className="absolute inset-0 bg-plum/10 group-hover:bg-transparent transition-colors" />
                    <div className="absolute bottom-0 inset-x-0 p-8 luxury-blur bg-opacity-90 border-t border-border">
                        <div className="flex items-center space-x-2 text-[10px] font-bold tracking-widest text-plum uppercase">
                            <Sparkles className="w-3 h-3 text-gold" />
                            <span>Maison Flagship</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 font-light italic">
                            Visit our flagship boutique in the heart of {currentCountry.office?.city} for a private viewing experience.
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}

export function GlobalAtelier({ countryCode }: { countryCode: string }) {
    const router = useRouter();

    const handleCountrySwitch = (code: string) => {
        router.push(`/${code}/contact`);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {Object.values(COUNTRIES).map((c) => (
                <button
                    key={c.code}
                    onClick={() => handleCountrySwitch(c.code)}
                    className={`p-8 border transition-all text-center space-y-4 hover:border-gold hover:shadow-luxury ${countryCode === c.code ? 'border-gold bg-white' : 'border-border bg-white/50'}`}
                >
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-plum">{c.code}</span>
                    <h4 className="text-xl font-headline font-bold text-gray-900 uppercase">{c.office?.city}</h4>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                        {c.office?.address.split(',')[0]}
                    </p>
                </button>
            ))}
        </div>
    );
}

function ContactItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-start space-x-4 group">
            <div className="mt-1">{icon}</div>
            <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
                <p className="text-sm font-light text-gray-900 leading-relaxed">{value}</p>
            </div>
        </div>
    );
}
