import { Linkedin, Twitter } from "lucide-react";
import Link from "next/link";
import {
  CIN,
  IR_EMAIL,
  IR_PHONE,
  IR_PHONE_DISPLAY,
  LEGAL_ENTITY_NAME,
  OPERATING_ADDRESS,
  REGISTERED_ADDRESS,
  copyrightLine,
  formatAddress,
} from "@baalvion/company";
import { Separator } from "../ui/separator";

// baalvion.com is the corporate front door and holds the group-level policies. IR links to those
// rather than publishing a second, divergent copy of the same terms.
const CORPORATE_URL = process.env.NEXT_PUBLIC_CORPORATE_URL || "https://baalvion.com";

// Every entry here resolves to a page that exists. The previous footer pointed eleven links at
// an empty fragment — including Investor Policy and Privacy Policy — which on an IR site reads
// as either a broken build or a company that has not written them. Anything without a real
// destination is deleted instead: Business Continuity, Tax Strategy and Gender Reports are
// listed-company disclosures, and an unlisted private company publishing them would be
// inventing them.
const INVESTOR_LINKS = [
  { label: "IR HOME", href: "/" },
  { label: "FINANCIALS", href: "/financials" },
  { label: "NEWS & EVENTS", href: "/news-and-events/news" },
  { label: "GOVERNANCE", href: "/governance/overview" },
  { label: "RESOURCES", href: "/resources" },
];

const LEGAL_LINKS = [
  { label: "Terms & Conditions", href: `${CORPORATE_URL}/legal/terms` },
  { label: "Privacy Policy", href: `${CORPORATE_URL}/legal/privacy` },
  { label: "Cookie Policy", href: `${CORPORATE_URL}/legal/cookies` },
];

// Copyright is rendered on the server. `new Date()` here would bake the build year into a static
// route and then quietly show a stale one; the year is resolved per request instead.
export default function Footer() {
  const year = new Date().getUTCFullYear();

  return (
    <footer className="bg-white text-black border-t border-gray-200 overflow-hidden">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-12">
            <Link href="/" className="flex items-center gap-2" aria-label="Baalvion Home">
              <span className="text-3xl font-extrabold tracking-tighter">Baalvion</span>
            </Link>
        </div>

        {/* Top section with addresses and links */}
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 text-xs sm:text-md">

          {/* Column 1: Headquarters */}
          <div className="space-y-4 text-xs sm:text-sm">
            <h4 className="font-bold tracking-widest border-b border-gray-100 pb-2 uppercase text-[10px]">{LEGAL_ENTITY_NAME}</h4>
            <div className="space-y-2">
                <p className="font-bold text-gray-500 uppercase text-[9px]">Corporate Office:</p>
                <address className="not-italic leading-relaxed">
                    {formatAddress(OPERATING_ADDRESS)}
                    <br />
                    <a href={`tel:${IR_PHONE}`} className="mt-2 block font-semibold hover:text-primary transition-colors">
                      Phone: {IR_PHONE_DISPLAY}
                    </a>
                </address>
            </div>
          </div>

          {/* Column 2: Contact Info & Registered Address */}
          <div className="space-y-8 text-xs sm:text-sm">
            <div className="space-y-4">
                <h4 className="font-bold tracking-widest border-b border-gray-100 pb-2 uppercase text-[10px]">CONTACT INFORMATION</h4>
                <div className="space-y-1">
                    <p className="font-semibold">Baalvion Investor Relations</p>
                    <p className="text-gray-600">
                      Email:{" "}
                      <a href={`mailto:${IR_EMAIL}`} className="hover:text-primary transition-colors">{IR_EMAIL}</a>
                    </p>
                </div>
            </div>
            <div className="space-y-4">
                <h4 className="font-bold tracking-widest border-b border-gray-100 pb-2 uppercase text-[10px]">REGISTERED ADDRESS</h4>
                <div className="space-y-2">
                    <p className="text-gray-400 text-[9px] uppercase font-bold">(Corporate/Legal Purposes)</p>
                    <address className="not-italic leading-relaxed text-gray-600">
                        CIN: {CIN}
                        <br />
                        {formatAddress(REGISTERED_ADDRESS)}
                    </address>
                </div>
            </div>
          </div>

          {/* Column 3: Investor Services */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1 text-xs sm:text-sm">
            <h4 className="font-bold tracking-widest border-b border-gray-100 pb-2 uppercase text-[10px]">INVESTOR SERVICES</h4>
            <ul className="grid grid-cols-2 lg:grid-cols-1 gap-y-3 font-bold text-gray-800">
              {INVESTOR_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary transition-colors uppercase tracking-tight">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-12 bg-gray-200" />

        {/* Bottom legal links */}
        <div className="flex justify-center flex-wrap gap-x-8 gap-y-4 text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-widest">
            {LEGAL_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-black transition-colors">
                {link.label}
              </a>
            ))}
        </div>

        <Separator className="my-12 bg-gray-200" />

        {/* Copyright and Social */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] sm:text-xs text-gray-400 font-medium">
            <p className="text-center md:text-left uppercase tracking-tighter">{copyrightLine(year)}</p>
            <div className="flex items-center gap-6">
             <a href="https://www.linkedin.com/company/baalvion" target="_blank" rel="noopener noreferrer" aria-label="Baalvion on LinkedIn" className="hover:text-black transition-colors"><Linkedin className="h-5 w-5"/></a>
             <a href="https://twitter.com/baalvion" target="_blank" rel="noopener noreferrer" aria-label="Baalvion on X" className="hover:text-black transition-colors"><Twitter className="h-5 w-5"/></a>
            </div>
        </div>
      </div>
    </footer>
  );
}
