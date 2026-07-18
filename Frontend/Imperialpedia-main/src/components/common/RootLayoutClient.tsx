"use client";
import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
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
import { AuthProvider } from "@/providers/AuthProvider";
import { usePathname } from "next/navigation";

type RootLayoutClientProps = Readonly<{ children: React.ReactNode }>;

// Routes that ship their own CNBC-style masthead/footer (src/components/cnbc/*
// via each route's own layout.tsx) and must not also get the sitewide
// Investopedia-style Navbar/Footer stacked on top — previously only /admin
// was excluded here, which meant /world silently double-stacked chrome
// (sitewide Navbar -> world's own TopNav -> world's own Footer -> sitewide
// Footer) despite world/layout.tsx's comment claiming otherwise.
const CNBC_ROUTES = ["/world", "/news", "/market-news"];

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
    const pathname = usePathname();
    const suppressGlobalChrome =
        pathname?.startsWith("/admin") ||
        CNBC_ROUTES.some((p) => pathname === p || pathname?.startsWith(`${p}/`));

    useEffect(() => {
        trackPageView(pathname);
    }, [pathname]);

    return (
        <>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                <I18nProvider>
                    <GlobalStoreProvider>
                        <ThemeProvider>
                            <ToastProvider>
                                <TooltipProvider>
                                    {!suppressGlobalChrome && <Navbar />}
                                    <main
                                        id="main-content"
                                        className={cn("flex-grow outline-none", !suppressGlobalChrome && "pt-16 lg:pt-[108px]")}
                                        tabIndex={-1}
                                    >
                                        {children}
                                    </main>
                                    {!suppressGlobalChrome && <Footer />}
                                    <Toaster />
                                    <SonnerToaster />
                                </TooltipProvider>
                            </ToastProvider>
                        </ThemeProvider>
                    </GlobalStoreProvider>
                </I18nProvider>
                </AuthProvider>
            </QueryClientProvider>
        </>
    );
}
