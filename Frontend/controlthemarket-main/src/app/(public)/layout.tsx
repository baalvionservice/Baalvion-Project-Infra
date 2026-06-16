import { PublicChrome } from '@/components/public-chrome';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Marketing chrome (Navbar/Footer) is applied here, EXCEPT on the full-bleed auth
  // surfaces (/login, /signup/*) where the branded AuthShell owns the whole screen.
  return <PublicChrome>{children}</PublicChrome>;
}
