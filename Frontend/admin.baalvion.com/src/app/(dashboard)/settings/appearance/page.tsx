'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, PanelLeft } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/lib/store/uiStore';

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Match my device', icon: Monitor },
] as const;

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { sidebarCollapsed, setSidebarCollapsed, setBreadcrumbs } = useUIStore();
  // next-themes only knows the real theme after mount; rendering earlier flashes the wrong choice.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    setBreadcrumbs([{ label: 'Settings', href: '/settings' }, { label: 'Appearance' }]);
  }, [setBreadcrumbs]);

  return (
    <div className="space-y-6">
      <PageHeader title="Appearance" description="Saved on this device and applied immediately." />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Theme</CardTitle>
          <CardDescription className="text-xs">Choose how the console looks.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Theme">
            {THEMES.map((t) => {
              const active = mounted && theme === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50',
                    active && 'border-primary ring-1 ring-primary',
                  )}
                >
                  <t.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><PanelLeft className="h-4 w-4" />Sidebar</CardTitle>
          <CardDescription className="text-xs">On a laptop or desktop. On a phone or tablet the menu always opens as a drawer.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="compact-sidebar" className="text-sm">Compact sidebar (icons only)</Label>
            <Switch id="compact-sidebar" checked={sidebarCollapsed} onCheckedChange={setSidebarCollapsed} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
