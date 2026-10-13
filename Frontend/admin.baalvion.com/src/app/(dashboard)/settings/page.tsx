'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Shield, Bell, Palette, Globe, UserCircle, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUIStore } from '@/lib/store/uiStore';

const SETTING_GROUPS = [
  { icon: UserCircle, title: 'Profile', description: 'Your name, email, role and the organisation you are signed in to', href: '/settings/profile' },
  { icon: Shield, title: 'Security', description: 'Password reset, authenticator app (two-step sign-in) and active sessions', href: '/settings/security' },
  { icon: Bell, title: 'Notifications', description: 'Choose which channels Baalvion may use to reach you', href: '/settings/notifications' },
  { icon: Palette, title: 'Appearance', description: 'Light, dark or automatic theme and sidebar behaviour', href: '/settings/appearance' },
  { icon: Globe, title: 'Platform', description: 'The websites and services this console manages, and where to configure them', href: '/settings/platform' },
];

export default function SettingsPage() {
  const { setBreadcrumbs } = useUIStore();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Settings' }]);
  }, [setBreadcrumbs]);

  return (
    <div>
      <PageHeader title="Settings" description="Your account and the platform configuration" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SETTING_GROUPS.map((group) => (
          <Link key={group.title} href={group.href} className="group">
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <group.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center justify-between text-base">
                      {group.title}
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </CardTitle>
                    <CardDescription className="mt-0.5 text-xs">{group.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
