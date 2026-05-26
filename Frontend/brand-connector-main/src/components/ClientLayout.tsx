'use client';
import React from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Toaster as HotToaster } from 'react-hot-toast';

import { FirebaseClientProvider } from '@/firebase'
import { AuthProvider } from '@/contexts/AuthContext'
import Header from './Header'
import Footer from './Footer'
import { usePathname } from 'next/navigation';

const ClientLayout = ({ children }: Readonly<{
    children: React.ReactNode;
}>) => {
    const usePath = usePathname();
    const isAdminPath = usePath.startsWith('/admin');
    const isDashboardPath = usePath.startsWith('/dashboard');
    return (
        <ErrorBoundary>
            <FirebaseClientProvider>
                <AuthProvider>
                    <div id="app-root">
                        {!(isAdminPath || isDashboardPath) && <Header />}
                        {children}
                        {!(isAdminPath || isDashboardPath) && <Footer />}
                    </div>
                    <ShadcnToaster />
                    <HotToaster position="top-right" reverseOrder={false} />
                </AuthProvider>
            </FirebaseClientProvider>
        </ErrorBoundary>
    )
}

export default ClientLayout