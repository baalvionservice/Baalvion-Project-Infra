
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import React from "react";
import { Metadata } from "next";
import { talentService } from "@/services/talent.service";
import { Button } from "@/components/ui/button";
import { Country } from "@/lib/talent-acquisition";
import { MapPin } from "lucide-react";

export const metadata: Metadata = {
    title: "Contact Us",
    description: "Get in touch with the Baalvion team. We're here to help with general inquiries, sales, partnerships, and candidate support.",
    alternates: {
        canonical: '/contact',
    },
    openGraph: {
        title: "Contact Us | TalentOS by Baalvion",
        description: "Get in touch with the Baalvion team.",
        url: '/contact'
    }
};

const ContactDetail = ({ category, contact, isLink = false }: { category: string; contact: string; isLink?: boolean }) => (
    <div>
        <p className="text-sm text-muted-foreground">{category}</p>
        <a
            href={isLink ? `https://${contact}` : `mailto:${contact}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-bold text-foreground break-words hover:underline"
        >
            {contact}
        </a>
    </div>
);

// No photograph: these were random picsum.photos images captioned as our offices.
// A card that states the address plainly is both honest and easier to read.
const LocationCard = ({ country, address }: { country: Country, address: string[] }) => (
    <div className="rounded-lg border bg-background p-6 transition-colors hover:border-foreground/25">
        <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
            <div>
                <h3 className="text-lg font-semibold">{country.name}</h3>
                <address className="mt-1 not-italic text-sm leading-relaxed text-muted-foreground">
                    {address.map((line, index) => (
                        <span key={index} className="block">{line}</span>
                    ))}
                </address>
            </div>
        </div>
    </div>
);


// Fetches live country data per request; opt out of build-time prerendering so
// the build does not depend on the jobs API being reachable in CI.
export const dynamic = 'force-dynamic';

export default async function ContactPage() {
    // Office locations — only the hub countries have one.
    const countries = await talentService.getCountries({ isActive: true, hub: true });
    const mockAddresses: { [key: string]: string[] } = {
        "country_in": ["Prestige Tech Park", "Bengaluru, 560103"],
        "country_us": ["123 Market Street", "San Francisco, CA 94105"],
        "country_gb": ["South Bank", "London, SE1 9GY"],
        "country_ca": ["1 Bloor Street East", "Toronto, ON M4W 1A9"],
        "country_pl": ["al. Jerozolimskie 98", "00-807 Warszawa"],
        "country_au": ["100 Pitt Street", "Sydney, NSW 2000"],
        "country_vn": ["District 1", "Ho Chi Minh City"],
        "country_ph": ["Ayala Avenue", "Makati, 1226 Metro Manila"],
        "country_ua": ["Khreshchatyk St, 1/2", "Kyiv, 01001"],
    };

    return (
        <main className="bg-muted/40 py-20 lg:py-32">
            <div className="container mx-auto mb-16 px-4">
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Contact Baalvion</h1>
                <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                    Where to find us, and who to write to. For anything about a live application,
                    message the hiring team from your candidate dashboard — it reaches them faster
                    and keeps everything on one thread.
                </p>
            </div>
            <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-5 gap-16">

                {/* LOCATIONS SECTION */}
                <div className="lg:col-span-3 space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold uppercase text-destructive tracking-wider">Our Locations</h2>
                        <Separator className="mt-2 w-16 h-1 bg-destructive" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {countries.map((country) => (
                             <LocationCard
                                key={country.id}
                                country={country}
                                address={mockAddresses[country.id] || [country.name]}
                             />
                        ))}
                    </div>
                </div>

                {/* CONTACT SECTION */}
                 <div className="lg:col-span-2 space-y-12">
                    <div>
                        <h2 className="text-2xl font-bold uppercase text-destructive tracking-wider">Contact</h2>
                        <Separator className="mt-2 w-16 h-1 bg-destructive" />
                    </div>
                    <div className="space-y-6">
                        <ContactDetail category="Business" contact="biz@baalvion.com" />
                        <ContactDetail category="Press & Content Creators" contact="media@baalvion.com" />
                        <ContactDetail category="Investors" contact="ir@baalvion.com" />
                        <ContactDetail category="Job Offers" contact="jobs@baalvion.com" />
                        <ContactDetail category="Technical Support" contact="support.baalvion.com" isLink />
                        <ContactDetail category="Product Safety" contact="baalvion.com/product-safety" isLink />
                        <ContactDetail category="Community" contact="contact.community@baalvion.com" />
                    </div>
                     <Button size="lg" variant="destructive" className="w-full text-lg">
                        Visit Our Press Center
                    </Button>
                </div>
            </div>
        </main>
    )
}
