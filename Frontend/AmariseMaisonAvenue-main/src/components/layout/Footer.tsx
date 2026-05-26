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
} from "lucide-react";
import { useParams } from "next/navigation";

const SocialLinks = [
    {
        name: "Phone",
        icon: Phone,
        href: "tel:+1234567890",
    },
    {
        name: "Email",
        icon: Mail,
        href: "info@amarisemaison@gmail.com",
    },
    {
        name: "Whatsapp",
        icon: MessageCircle,
        href: "https://wa.me/1234567890",
    }
]

export function Footer() {
    const { country } = useParams();
    const countryCode = (country as string) || "us";
    return (
        <footer className="bg-white text-black pt-8 md:pt-20 pb-10 border-t border-gray-100 font-body">
            <div className="container mx-auto  max-w-[1600px]">
                <div className="md:hidden mb-4 px-4">
                    <Accordion type="single" collapsible className="space-y-2">
                        <AccordionItem value="customer-care">
                            <AccordionTrigger className="uppercase  text-[11px] font-bold tracking-[0.2em]">Customer Care</AccordionTrigger>
                            <AccordionContent>
                                <ul className="space-y-4 text-[13px] font-light text-gray-900">
                                    <li>
                                        <Link
                                            href={`/${countryCode}/contact`}
                                            className="text-black transition-colors"
                                        >
                                            Contact Us
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${countryCode}/faq`}
                                            className="text-black transition-colors"
                                        >
                                            FAQ
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${countryCode}/account`}
                                            className="text-black transition-colors"
                                        >
                                            My Account
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${countryCode}/customer-service`}
                                            className="text-black transition-colors"
                                        >
                                            Shipping & Returns
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${countryCode}/customer-service`}
                                            className="text-black transition-colors"
                                        >
                                            Authenticity Guarantee
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${countryCode}/how-to-sell`}
                                            className="text-black transition-colors"
                                        >
                                            Sell To Us
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${countryCode}/appointments`}
                                            className="text-black transition-colors"
                                        >
                                            Showrooms
                                        </Link>
                                    </li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="about">
                            <AccordionTrigger className="uppercase  text-[11px] font-bold tracking-[0.2em]">About</AccordionTrigger>
                            <AccordionContent>
                                <ul className="space-y-4 text-[13px] font-light text-gray-900">
                                    <li>
                                        <Link
                                            href={`/${countryCode}/about`}
                                            className="text-black transition-colors"
                                        >
                                            About Us
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${countryCode}/contact`}
                                            className="text-black transition-colors"
                                        >
                                            Visit Us
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${countryCode}/about`}
                                            className="text-black transition-colors"
                                        >
                                            Message From Our Founder
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${countryCode}/journal`}
                                            className="text-black transition-colors"
                                        >
                                            Affiliates
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${countryCode}/journal`}
                                            className="text-black transition-colors"
                                        >
                                            Blog
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${countryCode}/journal`}
                                            className="text-black transition-colors"
                                        >
                                            Press
                                        </Link>
                                    </li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="shop">
                            <AccordionTrigger className="uppercase text-[11px] font-bold tracking-[0.2em]">Shop</AccordionTrigger>
                            <AccordionContent>
                                <ul className="space-y-4 text-[13px] font-light text-gray-900">
                                    <li>
                                        <Link
                                            href={`/${countryCode}/category/hermes`}
                                            className="text-black transition-colors"
                                        >
                                            Archive Registry
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${countryCode}/account/live`}
                                            className="text-black transition-colors"
                                        >
                                            Live Shops
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${countryCode}/category/new-arrivals`}
                                            className="text-black transition-colors"
                                        >
                                            New Arrivals
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${countryCode}/category/hermes`}
                                            className="text-black transition-colors"
                                        >
                                            Hermès
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${countryCode}/category/chanel`}
                                            className="text-black transition-colors"
                                        >
                                            Chanel
                                        </Link>
                                    </li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="sell-with-us">
                            <AccordionTrigger className="uppercase text-[11px] font-bold tracking-[0.2em]">Sell With Us</AccordionTrigger>
                            <AccordionContent>
                                <ul className="space-y-4 text-[13px] font-light text-gray-900">
                                    <li>
                                        <Link
                                            href={`/${countryCode}/how-to-sell`}
                                            className="text-black transition-colors"
                                        >
                                            How to Consign
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${countryCode}/sell`}
                                            className="text-black transition-colors"
                                        >
                                            Partner Portal
                                        </Link>
                                    </li>
                                </ul>

                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                    <div className="bg-cream  py-4 text-center space-y-3 border border-gray-100 text-[13px] text-gray-900">
                        <p className="uppercase">100% Authentic</p>
                        <ShieldCheck className="w-5 h-5 text-gray-400 mx-auto" />
                        <p className="uppercase">
                            Guaranteed
                        </p>
                        <p className="text-[10px] text-gray-800">
                            The #1 Trusted Seller of New & Pre-Owned Hermès Bags
                        </p>
                    </div>
                    <ul className="space-y-4 text-[12px] py-4 flex flex-col items-center font-light text-gray-600">
                        {SocialLinks.map((link) => (
                            <li key={link.name} className="flex flex-col items-center gap-2">
                                <Link
                                    href={link.href}
                                    className="text-black font-extrabold flex flex-col items-center gap-1 transition-colors"
                                >
                                    <link.icon className="w-6 h-6 fill-black stroke-white mr-2 stroke-2" />
                                    <span className="uppercase  font-bold tracking-widest">{link.name}:</span>
                                    <span className="font-light">{link.href}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>


                </div>

                <div className="hidden px-12 md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-8 items-start">
                    {/* Column 1: Customer Care */}
                    <div className="space-y-8">
                        <p className="text-[11px] font-bold tracking-[0.2em] uppercase border-b border-black pb-4 w-full">
                            Customer Care
                        </p>
                        <ul className="space-y-2 text-[13px] font-light text-gray-600">
                            <li>
                                <Link
                                    href={`/${countryCode}/contact`}
                                    className="text-black transition-colors"
                                >
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${countryCode}/faq`}
                                    className="text-black transition-colors"
                                >
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${countryCode}/account`}
                                    className="text-black transition-colors"
                                >
                                    My Account
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${countryCode}/customer-service`}
                                    className="text-black transition-colors"
                                >
                                    Shipping & Returns
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${countryCode}/customer-service`}
                                    className="text-black transition-colors"
                                >
                                    Authenticity Guarantee
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${countryCode}/how-to-sell`}
                                    className="text-black transition-colors"
                                >
                                    Sell To Us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${countryCode}/appointments`}
                                    className="text-black transition-colors"
                                >
                                    Showrooms
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 2: About */}
                    <div className="space-y-8">
                        <p className="text-[11px] font-bold tracking-[0.2em] uppercase border-b border-black pb-4 w-full">
                            About
                        </p>
                        <ul className="space-y-2 text-[13px] font-light text-gray-600">
                            <li>
                                <Link
                                    href={`/${countryCode}/about`}
                                    className="text-black transition-colors"
                                >
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${countryCode}/contact`}
                                    className="text-black transition-colors"
                                >
                                    Visit Us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${countryCode}/about`}
                                    className="text-black transition-colors"
                                >
                                    Message From Our Founder
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${countryCode}/journal`}
                                    className="text-black transition-colors"
                                >
                                    Affiliates
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${countryCode}/journal`}
                                    className="text-black transition-colors"
                                >
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${countryCode}/journal`}
                                    className="text-black transition-colors"
                                >
                                    Press
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Shop */}
                    <div className="space-y-8">
                        <p className="text-[11px] font-bold tracking-[0.2em] uppercase border-b border-black pb-4 w-full">
                            Shop
                        </p>
                        <ul className="space-y-2 text-[13px] font-light text-gray-600">
                            <li>
                                <Link
                                    href={`/${countryCode}/category/hermes`}
                                    className="text-black transition-colors"
                                >
                                    Archive Registry
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${countryCode}/account/live`}
                                    className="text-black transition-colors"
                                >
                                    Live Shops
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${countryCode}/category/new-arrivals`}
                                    className="text-black transition-colors"
                                >
                                    New Arrivals
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${countryCode}/category/hermes`}
                                    className="text-black transition-colors"
                                >
                                    Hermès
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${countryCode}/category/chanel`}
                                    className="text-black transition-colors"
                                >
                                    Chanel
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Sell & Trust */}
                    <div className="space-y-8">
                        <p className="text-[11px] font-bold tracking-[0.2em] uppercase border-b border-black pb-4 w-full">
                            Sell With Us
                        </p>
                        <ul className="space-y-2 text-[13px] font-light text-gray-600">
                            <li>
                                <Link
                                    href={`/${countryCode}/how-to-sell`}
                                    className="text-black transition-colors"
                                >
                                    How to Consign
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${countryCode}/sell`}
                                    className="text-black transition-colors"
                                >
                                    Partner Portal
                                </Link>
                            </li>
                        </ul>

                        <div className="bg-cream  py-4 text-center space-y-3 border border-gray-100 text-[13px] text-gray-900">
                            <p className="uppercase">100% Authentic</p>
                            <ShieldCheck className="w-5 h-5 text-gray-400 mx-auto" />
                            <p className="uppercase">
                                Guaranteed
                            </p>
                            <p className="text-[10px] text-gray-800">
                                The #1 Trusted Seller of New & Pre-Owned Hermès Bags
                            </p>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex px-12 flex-col mb-4 md:mb-12">

                    <ul className="space-y-4 text-[12px] flex flex-col font-light text-gray-600">
                        {SocialLinks.map((link) => (
                            <li key={link.name} className=" inline-flex items-center gap-2">
                                <Link
                                    href={link.href}
                                    className="text-black font-extrabold inline-flex items-center gap-2 transition-colors"
                                >
                                    <link.icon className="w-6 h-6 fill-black stroke-white mr-2 stroke-2" />
                                    <span className="uppercase  font-bold tracking-widest">{link.name}:</span>
                                    <span className="font-light">{link.href}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>

                </div>

                <div className="pt-8 px-4 md:px-12 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                        <span className="font-headline text-3xl font-bold tracking-tight">
                            AMARISÉ{" "}
                            <span className="text-[12px] uppercase ml-2">
                                MAISON AVENUE
                            </span>
                        </span>
                        <p className="text-[9px] text-black text-center md:text-right">
                            © 2026 Amarisé Maison Avenue. All Rights Reserved. Amarisé Maison Avenue is a registered Trademark of Amarisé Maison Avenue Inc.
                        </p>
                    </div>
                    <div className="flex items-center text-[10px] underline justify-between gap-4">
                        <Link href={`/${countryCode}/privacy-policy`}>
                            Our Privacy Policy
                        </Link>
                        <Link href={`/${countryCode}/terms-of-service`}>
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}