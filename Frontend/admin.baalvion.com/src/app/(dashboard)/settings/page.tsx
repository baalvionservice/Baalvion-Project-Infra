'use client';

import { useEffect } from 'react';
import { Shield, Bell, Palette, Globe } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUIStore } from '@/lib/store/uiStore';

const SETTING_GROUPS = [
  {
    icon: Shield,
    title: 'Security',
    description: 'Password, MFA, and session management',
    href: '/settings/security',
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Email, push, and in-app notification preferences',
    href: '/settings/notifications',
  },
  {
    icon: Palette,
    title: 'Appearance',
    description: 'Theme, density, and display preferences',
    href: '/settings/appearance',
  },
  {
    icon: Globe,
    title: 'Platform',
    description: 'Domain, branding, and platform-wide settings',
    href: '/settings/platform',
  },
];

export default function SettingsPage() {
  const { setBreadcrumbs } = useUIStore();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Settings' }]);
  }, [setBreadcrumbs]);

  return (
    <div>
      <PageHeader title="Settings" description="Platform and account configuration" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SETTING_GROUPS.map((group) => (
          <Card
            key={group.title}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => {}}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <group.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{group.title}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">{group.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
