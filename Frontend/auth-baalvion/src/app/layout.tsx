import type { Metadata } from 'next';
import { fontVariables } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sign in · Baalvion',
  description: 'Secure passwordless sign-in for the Baalvion platform.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={fontVariables}>{children}</body>
    </html>
  );
}
