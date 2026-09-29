"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import {
    Phone,
    Mail,
    MessageCircle,
    ShieldCheck,
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    Music2,
    type LucideIcon,
} from "lucide-react";
import { useParams } from "next/navigation";
import { getFooterConfig, type FooterConfig, type FooterSocialIcon } from "@/lib/cms";
import { FOOTER_FALLBACK } from "@/lib/mock-data";

const SOCIAL_ICON_MAP: Record<FooterSocialIcon, LucideIcon> = {
    phone: Phone,
    email: Mail,
    whatsapp: MessageCircle,
    facebook: Facebook,
    twitter: Twitter,
    instagram: Instagram,
    youtube: Youtube,
    tiktok: Music2,
};

export function Footer() {
    const { country } = useParams();
    const countryCode = (country as string) || "us";
    const [config, setConfig] = useState<FooterConfig>(FOOTER_FALLBACK);

    useEffect(() => {
        let cancelled = false;
        getFooterConfig().then((cfg) => {
            if (!cancelled && cfg) setConfig(cfg);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const [customerCare, about, shop, sellWithUs] = config.columns;

    return (
        <footer className="bg-white text-black pt-8 md:pt-20 pb-10 border-t border-gray-100 font-body">
            <div className="container mx-auto  max-w-[1600px]">
                <div className="md:hidden mb-4 px-4">
                    <Accordion type="single" collapsible className="space-y-2">
                        {config.columns.map((column) => (
                            <AccordionItem key={column.title} value={column.title}>
                                <AccordionTrigger className="uppercase  text-[11px] font-bold tracking-[0.2em]">{column.title}</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="space-y-4 text-[13px] font-light text-gray-900">
                                        {column.links.map((link) => (
                                            <li key={`${column.title}-${link.label}`}>
                                                <Link
                                                    href={`/${countryCode}${link.href}`}
                                                    className="text-black transition-colors"
                                                >
                                                    {link.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                    <div className="bg-cream  py-4 text-center space-y-3 border border-gray-100 text-[13px] text-gray-900">
                        <p className="uppercase">{config.trustBadge.eyebrow}</p>
                        <ShieldCheck className="w-5 h-5 text-gray-400 mx-auto" />
                        <p className="uppercase">
                            {config.trustBadge.title}
                        </p>
                        <p className="text-[10px] text-gray-800">
                            {config.trustBadge.description}
                        </p>
                    </div>
                    <ul className="space-y-4 text-[12px] py-4 flex flex-col items-center font-light text-gray-600">
                        {config.socialLinks.map((link) => {
                            const Icon = SOCIAL_ICON_MAP[link.icon];
                            return (
                                <li key={link.name} className="flex flex-col items-center gap-2">
                                    <Link
                                        href={link.href}
                                        className="text-black font-extrabold flex flex-col items-center gap-1 transition-colors"
                                    >
                                        <Icon className="w-6 h-6 fill-black stroke-white mr-2 stroke-2" />
                                        <span className="uppercase  font-bold tracking-widest">{link.name}:</span>
                                        <span className="font-light">{link.href}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>


                </div>

                <div className="hidden px-12 md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-8 items-start">
                    {/* Column 1: Customer Care */}
                    <div className="space-y-8">
                        <p className="text-[11px] font-bold tracking-[0.2em] uppercase border-b border-black pb-4 w-full">
                            {customerCare?.title}
                        </p>
                        <ul className="space-y-2 text-[13px] font-light text-gray-600">
                            {customerCare?.links.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={`/${countryCode}${link.href}`}
                                        className="text-black transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 2: About */}
                    <div className="space-y-8">
                        <p className="text-[11px] font-bold tracking-[0.2em] uppercase border-b border-black pb-4 w-full">
                            {about?.title}
                        </p>
                        <ul className="space-y-2 text-[13px] font-light text-gray-600">
                            {about?.links.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={`/${countryCode}${link.href}`}
                                        className="text-black transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Shop */}
                    <div className="space-y-8">
                        <p className="text-[11px] font-bold tracking-[0.2em] uppercase border-b border-black pb-4 w-full">
                            {shop?.title}
                        </p>
                        <ul className="space-y-2 text-[13px] font-light text-gray-600">
                            {shop?.links.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={`/${countryCode}${link.href}`}
                                        className="text-black transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 4: Sell & Trust */}
                    <div className="space-y-8">
                        <p className="text-[11px] font-bold tracking-[0.2em] uppercase border-b border-black pb-4 w-full">
                            {sellWithUs?.title}
                        </p>
                        <ul className="space-y-2 text-[13px] font-light text-gray-600">
                            {sellWithUs?.links.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={`/${countryCode}${link.href}`}
                                        className="text-black transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <div className="bg-cream  py-4 text-center space-y-3 border border-gray-100 text-[13px] text-gray-900">
                            <p className="uppercase">{config.trustBadge.eyebrow}</p>
                            <ShieldCheck className="w-5 h-5 text-gray-400 mx-auto" />
                            <p className="uppercase">
                                {config.trustBadge.title}
                            </p>
                            <p className="text-[10px] text-gray-800">
                                {config.trustBadge.description}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex px-12 flex-col mb-4 md:mb-12">

                    <ul className="space-y-4 text-[12px] flex flex-col font-light text-gray-600">
                        {config.socialLinks.map((link) => {
                            const Icon = SOCIAL_ICON_MAP[link.icon];
                            return (
                                <li key={link.name} className=" inline-flex items-center gap-2">
                                    <Link
                                        href={link.href}
                                        className="text-black font-extrabold inline-flex items-center gap-2 transition-colors"
                                    >
                                        <Icon className="w-6 h-6 fill-black stroke-white mr-2 stroke-2" />
                                        <span className="uppercase  font-bold tracking-widest">{link.name}:</span>
                                        <span className="font-light">{link.href}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                </div>

                <div className="pt-8 px-4 md:px-12 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                        <span className="font-headline text-3xl font-bold tracking-tight">
                            {config.brandName}{" "}
                            <span className="text-[12px] uppercase ml-2">
                                {config.brandSuffix}
                            </span>
                        </span>
                        <p className="text-[9px] text-black text-center md:text-right">
                            {config.copyrightText}
                        </p>
                    </div>
                    <div className="flex items-center text-[10px] underline justify-between gap-4">
                        {config.legalLinks.map((link) => (
                            <Link key={link.label} href={`/${countryCode}${link.href}`}>
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}
