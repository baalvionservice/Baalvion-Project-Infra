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
import { VipEmailSignup } from "@/components/home/VipEmailSingup";
import { MeowTrigger } from "@/components/layout/JudyTrigger";
import { CookiePopup } from "@/components/layout/CookiePopup";
import { Footer } from "@/components/layout/Footer";

export default function CountryLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const [isMobile, setIsMobile] = React.useState<boolean>(true);

  const { currentLanguage } = useAppStore();
  const pathname = usePathname();

  const isCollectionPage = pathname?.includes("/category/") || pathname?.includes("/account/live");
  const isProductPage = pathname?.includes("/product/");

  console.log(isCollectionPage, isProductPage)
  function checkMobile() {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
    }
  }

  useEffect(() => {
    checkMobile();
    // Update directionality on load
    document.documentElement.dir = i18n.getDirection();
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  return (
    <div dir={i18n.getDirection()}>
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
