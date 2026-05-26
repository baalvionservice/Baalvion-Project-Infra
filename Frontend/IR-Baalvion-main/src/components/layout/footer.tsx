
import {  Linkedin, Twitter, Youtube } from "lucide-react";
import Link from "next/link";
import { Separator } from "../ui/separator";

export default function Footer() {
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
            <h4 className="font-bold tracking-widest border-b border-gray-100 pb-2 uppercase text-[10px]">BAALVION, INC.</h4>
            <div className="space-y-2">
                <p className="font-bold text-gray-500 uppercase text-[9px]">Headquarters:</p>
                <address className="not-italic leading-relaxed">
                    Yeshwant Avenue Building, NX, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303
                    <br />
                    <span className="mt-2 block font-semibold">Phone: +91 8951284770</span>
                </address>
            </div>
          </div>

          {/* Column 2: Contact Info & Registered Address */}
          <div className="space-y-8 text-xs sm:text-sm">
            <div className="space-y-4">
                <h4 className="font-bold tracking-widest border-b border-gray-100 pb-2 uppercase text-[10px]">CONTACT INFORMATION</h4>
                <div className="space-y-1">
                    <p className="font-semibold">Baalvion Investor Relations</p>
                    <p className="text-gray-600">Email: invrel@baalvion.com</p>
                </div>
            </div>
            <div className="space-y-4">
                <h4 className="font-bold tracking-widest border-b border-gray-100 pb-2 uppercase text-[10px]">REGISTERED ADDRESS</h4>
                <div className="space-y-2">
                    <p className="text-gray-400 text-[9px] uppercase font-bold">(Corporate/Legal Purposes)</p>
                    <address className="not-italic leading-relaxed text-gray-600">
                        CIN: U43121OD2025PTC048479
                        <br />
                        C/o Dilip Kumar Kuldeep, Upper Mania, Po- Pakjhola, Semiliguda, Koraput, Koraput, Orissa, India, 764036
                    </address>
                </div>
            </div>
          </div>

          {/* Column 3: Investor Services */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1 text-xs sm:text-sm">
            <h4 className="font-bold tracking-widest border-b border-gray-100 pb-2 uppercase text-[10px]">INVESTOR SERVICES</h4>
            <ul className="grid grid-cols-2 lg:grid-cols-1 gap-y-3 font-bold text-gray-800">
              <li><Link href="#" className="hover:text-primary transition-colors uppercase tracking-tight">IR HOME</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors uppercase tracking-tight">FINANCIALS</Link></li>
              <li><Link href="#news" className="hover:text-primary transition-colors uppercase tracking-tight">NEWS & EVENTS</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors uppercase tracking-tight">STOCK INFORMATION</Link></li>
              <li><Link href="#governance" className="hover:text-primary transition-colors uppercase tracking-tight">GOVERNANCE</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors uppercase tracking-tight">RESOURCES</Link></li>
            </ul>
          </div>
        </div>

        <Separator className="my-12 bg-gray-200" />

        {/* Bottom legal links */}
        <div className="flex justify-center flex-wrap gap-x-8 gap-y-4 text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-widest">
            <Link href="#" className="hover:text-black transition-colors">Terms & Conditions</Link>
            <Link href="#" className="hover:text-black transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-black transition-colors">Business Continuity</Link>
            <Link href="#" className="hover:text-black transition-colors">Tax Strategy</Link>
            <Link href="#" className="hover:text-black transition-colors">Gender Reports</Link>
            <Link href="#" className="hover:text-black transition-colors">Investor Policy</Link>
            <Link href="#" className="hover:text-black transition-colors">Manage Cookies</Link>
        </div>

        <Separator className="my-12 bg-gray-200" />

        {/* Copyright and Social */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] sm:text-xs text-gray-400 font-medium">
            <p className="text-center md:text-left uppercase tracking-tighter">© 2026 Baalvion, Inc. All rights reserved. Powered by Baalvion Group Infrastructure.</p>
            <div className="flex items-center gap-6">
             <Link href="#" aria-label="LinkedIn" className="hover:text-black transition-colors"><Linkedin className="h-5 w-5"/></Link>
             <Link href="#" aria-label="Twitter" className="hover:text-black transition-colors"><Twitter className="h-5 w-5"/></Link>
             <Link href="#" aria-label="YouTube" className="hover:text-black transition-colors"><Youtube className="h-5 w-5"/></Link>
            </div>
        </div>
      </div>
    </footer>
  );
}
