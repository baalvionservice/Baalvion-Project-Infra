import type { MetadataRoute } from 'next';
import { AppConfig } from '@/config/app.config';

// Web App Manifest — helps search engines and browsers understand the site's
// branding, and enables install/PWA affordances.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${AppConfig.appName} by Baalvion`,
    short_name: AppConfig.appName,
    description:
      'The intelligent talent platform connecting students, colleges, and recruiters with borderless opportunity.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    // `/logo.png` follows the same asset convention as the root layout's
    // OpenGraph/Organization metadata (supplied at deploy time).
    icons: [{ src: '/logo.png', sizes: '512x512', type: 'image/png' }],
  };
}
