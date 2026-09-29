'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Settings, Users, Building, Puzzle, CreditCard, Shield, Palette, AlertTriangle } from 'lucide-react';

const navItems = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'users', label: 'Users & Roles', icon: Users },
  { id: 'businesses', label: 'Businesses', icon: Building },
  { id: 'integrations', label: 'Integrations', icon: Puzzle },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'white-label', label: 'White Label', icon: Palette },
  { id: 'danger-zone', label: 'Danger Zone', icon: AlertTriangle },
];

interface SettingsSidebarProps {
  activeSection: string;
  setActiveSection: (section: any) => void;
}

export default function SettingsSidebar({ activeSection, setActiveSection }: SettingsSidebarProps) {
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <Button
          key={item.id}
          variant="ghost"
          className={cn(
            'justify-start gap-2',
            activeSection === item.id && 'bg-accent text-accent-foreground'
          )}
          onClick={() => setActiveSection(item.id)}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
        </Button>
      ))}
    </nav>
  );
}
