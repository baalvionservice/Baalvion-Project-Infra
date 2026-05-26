import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { SubmissionsProvider } from '@/contexts/submissions-context';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-headline',
});

export const metadata: Metadata = {
  title: 'SkillMatch Pro',
  description: 'The Proof-of-Skill Hiring Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <AuthProvider>
          <SubmissionsProvider>
              {children}
              <Toaster />
          </SubmissionsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
