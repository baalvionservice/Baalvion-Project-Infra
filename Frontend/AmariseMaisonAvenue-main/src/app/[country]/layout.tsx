"use client";

import React, { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { useParams, usePathname } from "next/navigation";
import { ShowcaseControls } from "@/components/demo/ShowcaseControls";
import { MaisonPopup } from "@/components/layout/MaisonPopup";
import { MadAveLiveWidget } from "@/components/layout/MadAveLiveWidget";
import { CartSheet } from "@/components/layout/CartSheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";

import { useAppStore } from "@/lib/store";
import { i18n } from "@/lib/i18n/engine";
import { normalizeCountry, countryToLanguage } from "@/lib/i18n/countries";
import type { SupportedLanguage } from "@/lib/i18n/config";
import { VipEmailSignup } from "@/components/home/VipEmailSingup";
import { MeowTrigger } from "@/components/layout/JudyTrigger";
import { CookiePopup } from "@/components/layout/CookiePopup";
import { Footer } from "@/components/layout/Footer";
import { PresenceBeacon } from "@/components/layout/PresenceBeacon";

export default function CountryLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const [isMobile, setIsMobile] = React.useState<boolean>(true);

  const { setLanguage } = useAppStore();
  const params = useParams();
  const country = normalizeCountry(params?.country);
  const pathname = usePathname();

  const isCollectionPage = pathname?.includes("/category/") || pathname?.includes("/account/live");
  const isProductPage = pathname?.includes("/product/");

  function checkMobile() {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
    }
  }

  useEffect(() => {
    checkMobile();
  }, []);

  // Lead each market in its default language (AE → Arabic/RTL), while honouring
  // a manual language switch made within the same country.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(
      "maison_lang"
    ) as SupportedLanguage | null;
    const prevCountry = localStorage.getItem("maison_country");
    const nextLang: SupportedLanguage =
      prevCountry === country && stored ? stored : countryToLanguage(country);

    i18n.setLanguage(nextLang); // persists maison_lang + sets <html lang/dir>
    setLanguage(nextLang);
    localStorage.setItem("maison_country", country);
    document.documentElement.dir = i18n.getDirection();
    document.documentElement.lang = i18n.getLanguage();
  }, [country, setLanguage]);

  return (
    <div dir={i18n.getDirection()}>
      {/* Invisible: announces this storefront tab as a live visitor (admin sees the count). */}
      <PresenceBeacon />
      {/* <MaisonPopup /> */}
      {/* <MadAveLiveWidget /> */}

      {/*......... We will enable it when we integrate backend for AI Chat .........*/}



      {/* {(isCollectionPage || isProductPage) && <MeowTrigger />} */}
      <CookiePopup />
      <CartSheet />
      <Header />
      {/* Optimized Content Offset for Responsive Tiered Header */}
      <main
        id="main-content"
        className="min-h-screen animate-fade-in relative bg-white"
      >
        {children}
      </main>
      <VipEmailSignup />


      <Footer />
      {!isMobile && <ShowcaseControls />}
    </div>
  );
}
