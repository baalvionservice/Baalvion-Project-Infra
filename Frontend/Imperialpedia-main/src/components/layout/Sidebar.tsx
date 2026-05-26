'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Settings, 
  BarChart3, 
  Users,
  ShieldCheck,
  FileText,
  Brain,
  DollarSign,
  Package,
  MessageSquare,
  Zap,
  ChevronRight,
  LogOut,
  Terminal
} from 'lucide-react';
import { Text } from '@/design-system/typography/text';
import { useAppStore } from '@/lib/state/app-store';
import { Badge } from '@/components/ui/badge';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  href: string;
  badge?: number;
}

const SidebarItem = ({
  icon: Icon,
  label,
  href,
  isActive,
  badge,
}: SidebarItemProps) => (
  <Link
    href={href}
    className={cn(
      'flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 group',
      isActive 
        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    )}
  >
    <div className="flex items-center space-x-3">
      <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'group-hover:text-primary')} />
      <span className="text-xs font-bold uppercase tracking-wider">
        {label}
      </span>
    </div>
    {badge !== undefined && badge > 0 && (
      <span
        className={cn(
          "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
          isActive ? "bg-white text-primary" : "bg-primary/20 text-primary"
        )}
      >
        {badge}
      </span>
    )}
  </Link>
);

const Sidebar = ({ className }: { className?: string }) => {
  const pathname = usePathname();
  const { currentUser } = useAppStore();
  
  const navGroups = [
    {
      title: 'Control',
      items: [
        { icon: LayoutDashboard, label: 'Overview', href: '/admin/dashboard' },
        { icon: FileText, label: 'Content', href: '/admin/content' },
        { icon: Brain, label: 'AI Workspace', href: '/admin/ai' },
      ]
    },
    {
      title: 'Identity',
      items: [
        { icon: Users, label: 'Users', href: '/admin/users' },
        { icon: Package, label: 'Vendors', href: '/admin/vendors' },
        { icon: MessageSquare, label: 'Community', href: '/admin/community' },
      ]
    },
    {
      title: 'Fiscal',
      items: [
        { icon: DollarSign, label: 'Finance', href: '/admin/finance' },
        { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
        { icon: Settings, label: 'Settings', href: '/admin/settings' },
      ]
    }
  ];

  return (
    <aside className={cn('w-64 border-r h-full bg-card/30 flex flex-col p-4 backdrop-blur-xl sticky top-0', className)}>
      <div className="mb-10 px-4 py-4 border-b border-white/5">
        <Link href="/" className="text-2xl font-headline font-bold text-primary tracking-tighter">
          Imperial<span className="text-foreground">pedia</span>
        </Link>
        <Text variant="label" className="text-[8px] opacity-40 mt-1 uppercase font-bold tracking-[0.3em]">Management Cluster</Text>
      </div>

      <div className="space-y-8 flex-grow overflow-y-auto no-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <Text variant="label" className="px-4 text-[9px] text-muted-foreground/60 font-bold uppercase tracking-[0.2em]">{group.title}</Text>
            <div className="space-y-1">
              {group.items.map((item) => (
                <SidebarItem
                  key={item.href}
                  {...item}
                  isActive={pathname === item.href}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-white/5 space-y-4">
        <div className="px-4 py-4 bg-primary/5 rounded-2xl border border-primary/10 relative overflow-hidden group cursor-pointer">
          <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:rotate-12 transition-transform">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <Text variant="caption" className="text-primary font-bold block uppercase text-[8px] tracking-widest mb-1">Authenticated</Text>
          <Text variant="bodySmall" weight="bold" className="truncate text-foreground/90">{currentUser?.name || 'Administrator'}</Text>
          <Badge variant="outline" className="mt-2 text-[8px] border-primary/20 text-primary font-bold uppercase tracking-widest h-5">
            {currentUser?.role || 'Root'}
          </Badge>
        </div>
        
        <button className="flex items-center gap-3 px-4 py-2 w-full text-muted-foreground hover:text-destructive transition-colors group outline-none">
          <Terminal className="h-4 w-4 group-hover:text-destructive" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Terminate Session</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;