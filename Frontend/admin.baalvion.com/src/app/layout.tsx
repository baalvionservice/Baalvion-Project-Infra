import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import QueryProvider from '@/providers/QueryProvider';
import ThemeProvider from '@/providers/ThemeProvider';
import AuthProvider from '@/providers/AuthProvider';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | Baalvion Admin',
    default: 'Baalvion Admin',
  },
  description: 'Unified Enterprise Admin & CMS Platform',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              {children}
              <Toaster
                position="bottom-right"
                richColors
                closeButton
                duration={4000}
              />
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
