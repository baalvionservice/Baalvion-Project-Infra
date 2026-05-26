"use client";

import Link from "next/link";
import { Globe, ChevronUp, Lock } from "lucide-react";
import { useState, useEffect } from "react";

export function Footer() {
  const [currentYear, setCurrentYear] = useState(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-[#151B24] text-white pt-12 sm:pt-16 lg:pt-20 pb-10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 xl:gap-24">
          {/* Left Section: Logo & Links */}
          <div className="lg:w-1/2 flex flex-col gap-12 lg:gap-16">
            <div className="space-y-6">
              <Link href="/" className="flex items-center gap-3 group w-fit">
                <div className="w-10 h-10 bg-[#FF9900] flex items-center justify-center rounded-sm shadow-sm transition-transform">
                  <Globe className="text-white w-6 h-6" />
                </div>
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-none">
                  BAALVION
                </span>
              </Link>

              <div className="flex flex-col gap-4 text-sm font-bold text-gray-300">
                <div className="flex items-center gap-2 cursor-pointer hover:text-[#FF9900] transition-colors w-fit">
                  <span className="text-xs">Country & Language:</span>
                  <div className="flex items-center gap-1.5 border border-gray-600 px-2 py-1 rounded-sm bg-gray-800/50">
                    <span className="text-[10px]">🇺🇸 EN</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-12">
              <div className="space-y-3">
                <Link
                  href="/news/updates"
                  className="block text-sm font-bold text-gray-300 hover:text-[#FF9900] transition-colors"
                >
                  Baalvion News
                </Link>
                <Link
                  href="#"
                  className="block text-sm font-bold text-gray-300 hover:text-[#FF9900] transition-colors"
                >
                  Press Center{" "}
                  <span className="inline-block text-[10px] ml-1 opacity-50">
                    ↗
                  </span>
                </Link>
                <Link
                  href="/"
                  className="block text-sm font-bold text-gray-300 hover:text-[#FF9900] transition-colors"
                >
                  Baalvion.nexus{" "}
                  <span className="inline-block text-[10px] ml-1 opacity-50">
                    ↗
                  </span>
                </Link>
                <Link
                  href="/investors"
                  className="block text-sm font-bold text-gray-300 hover:text-[#FF9900] transition-colors"
                >
                  Investor Resources{" "}
                  <span className="inline-block text-[10px] ml-1 opacity-50">
                    ↗
                  </span>
                </Link>
              </div>
              <div className="space-y-3">
                <Link
                  href="/careers"
                  className="block text-sm font-bold text-gray-300 hover:text-[#FF9900] transition-colors"
                >
                  Careers{" "}
                  <span className="inline-block text-[10px] ml-1 opacity-50">
                    ↗
                  </span>
                </Link>
                <Link
                  href="#"
                  className="block text-sm font-bold text-gray-300 hover:text-[#FF9900] transition-colors"
                >
                  Site Map
                </Link>
                <Link
                  href="/platform"
                  className="block text-sm font-bold text-gray-300 hover:text-[#FF9900] transition-colors"
                >
                  More from Baalvion
                </Link>
              </div>
            </div>
          </div>

          {/* Vertical Separator */}
          <div className="hidden lg:block w-px bg-gray-700 self-stretch" />

          {/* Right Section: Subscription */}
          <div className="lg:w-1/2 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Subscribe to Baalvion News
              </h3>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                Sign up for the latest news, facts, analysis, and original
                stories about Baalvion, delivered to you weekly.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <input
                  type="email"
                  placeholder="Enter email"
                  className="w-full bg-transparent border-b border-gray-600 focus:border-[#FF9900] py-3 text-white outline-none transition-colors placeholder:text-gray-500"
                />
              </div>
              <button className="bg-[#FF9900] hover:bg-[#e68a00] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold transition-all transform active:scale-95 shadow-lg text-sm sm:text-base">
                Subscribe
              </button>
              <div className="text-[10px] sm:text-[11px] text-gray-500 font-bold uppercase tracking-widest flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Link
                  href="/privacy"
                  className="hover:text-white transition-colors underline underline-offset-4 w-fit"
                >
                  Baalvion Privacy Policy
                </Link>
                <span>Opt out anytime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Social & Bottom Bar */}
        <div className="mt-16 lg:mt-20 pt-8 lg:pt-10 border-t border-gray-800 flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex gap-6 sm:gap-8">
              <Link
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" />
                </svg>
              </Link>
            </div>
            <Link
              href="/admin/login"
              className="flex items-center gap-2 text-[9px] sm:text-[10px] font-bold text-gray-500 hover:text-[#FF9900] uppercase tracking-widest transition-colors"
            >
              <Lock className="w-3 h-3" /> Administrative Portal
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            <div className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2">
              <Link href="/" className="hover:text-white transition-colors">
                Baalvion.nexus
              </Link>
              <Link
                href="/terms"
                className="hover:text-white transition-colors"
              >
                Conditions of Use
              </Link>
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Baalvion Privacy Policy
              </Link>
              <span className="text-gray-600">
                © 1996-{currentYear} Baalvion Industries Private Limited.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top */}
      <button
        onClick={scrollToTop}
        className="absolute bottom-4 sm:bottom-6 lg:bottom-8 right-4 sm:right-6 lg:right-8 w-10 h-10 sm:w-12 sm:h-12 bg-white text-gray-900 rounded-full flex items-center justify-center shadow-2xl hover:bg-gray-100 transition-all transform hover:-translate-y-1 active:scale-90 z-10"
        aria-label="Back to top"
      >
        <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    </footer>
  );
}
