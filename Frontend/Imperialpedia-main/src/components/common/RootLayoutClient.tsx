"use client";
import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { CookieConsent } from "@/components/common/CookieConsent";
import ToastProvider from "@/components/common/ToastManager";
import { Toaster as SonnerToaster } from "sonner";
import { GlobalStoreProvider } from "@/lib/state";
import { ThemeProvider } from "@/design-system/themes/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { trackPageView } from "@/lib/utils/analytics";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/services/query-client";
import { usePathname } from "next/navigation";

type RootLayoutClientProps = Readonly<{ children: React.ReactNode }>;

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
    const pathname = usePathname();
    const isAdminPath = pathname?.startsWith("/admin");

    useEffect(() => {
        trackPageView(pathname);
    }, [pathname]);

    return (
        <>
            <QueryClientProvider client={queryClient}>
                <I18nProvider>
                    <GlobalStoreProvider>
                        <ThemeProvider>
                            <ToastProvider>
                                <TooltipProvider>
                                    {!isAdminPath && <Navbar />}
                                    <CookieConsent />
                                    <main
                                        id="main-content"
                                        className={cn("flex-grow outline-none", !isAdminPath && "mt-16")}
                                        tabIndex={-1}
                                    >
                                        {children}
                                    </main>
                                    {!isAdminPath && <Footer />}
                                    <Toaster />
                                    <SonnerToaster />
                                </TooltipProvider>
                            </ToastProvider>
                        </ThemeProvider>
                    </GlobalStoreProvider>
                </I18nProvider>
            </QueryClientProvider>
        </>
    );
}
