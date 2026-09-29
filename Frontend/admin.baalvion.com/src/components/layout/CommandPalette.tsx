'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  LayoutDashboard, Users, Building2, FileText, BarChart3, CreditCard,
  Bell, ScrollText, ToggleLeft, Settings, Image, Shield, Monitor,
  Server, Code2, Headphones, Bot, KeyRound, ShieldAlert, Globe,
  Activity, Database, Zap, Search, ArrowRight, Hash, Package,
  MessageSquare, Webhook, LifeBuoy, TrendingUp, Lock, UserCheck,
  Cpu, HardDrive, Network, GitBranch, BookOpen, Layers,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/lib/store/uiStore';
import { useRealtimeStore } from '@/lib/store/realtimeStore';

interface Cmd {
  id:       string;
  label:    string;
  desc?:    string;
  href?:    string;
  action?:  () => void;
  icon:     React.ComponentType<{ className?: string }>;
  group:    string;
  keywords?: string[];
  badge?:   string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const NAV_COMMANDS: Cmd[] = [
  // Overview
  { id: 'dashboard',    label: 'Command Center',         desc: 'Platform overview & live metrics',       href: '/dashboard',         icon: LayoutDashboard, group: 'Overview', keywords: ['home','kpi','metrics'] },
  { id: 'analytics',   label: 'Analytics Platform',      desc: 'Funnels, cohorts, BI dashboards',        href: '/analytics',         icon: BarChart3,       group: 'Overview' },

  // Identity
  { id: 'identity',    label: 'Identity Center',          desc: 'Users, sessions, RBAC, OAuth',           href: '/identity',          icon: UserCheck,       group: 'Identity' },
  { id: 'users',       label: 'User Directory',           desc: 'Manage all platform users',              href: '/users',             icon: Users,           group: 'Identity' },
  { id: 'orgs',        label: 'Organizations',            desc: 'Manage orgs & tenants',                  href: '/organizations',     icon: Building2,       group: 'Identity' },
  { id: 'sessions',    label: 'Sessions',                 desc: 'Active sessions & risk monitoring',      href: '/sessions',          icon: Monitor,         group: 'Identity' },
  { id: 'oauth',       label: 'OAuth Clients',            desc: 'Manage OAuth apps & credentials',        href: '/oauth',             icon: KeyRound,        group: 'Identity' },
  { id: 'roles',       label: 'Roles & Permissions',      desc: 'RBAC role matrix editor',                href: '/identity?tab=roles',icon: Lock,            group: 'Identity' },

  // Security
  { id: 'security',    label: 'Security Operations',      desc: 'SOC · Fraud · Threat intelligence',      href: '/security',          icon: ShieldAlert,     group: 'Security', badge: 'SOC' },
  { id: 'audit',       label: 'Audit Logs',               desc: 'Full platform audit trail',               href: '/audit-logs',        icon: ScrollText,      group: 'Security' },

  // Infrastructure
  { id: 'infra',       label: 'Infrastructure',           desc: 'K8s, services, queues, databases',       href: '/infrastructure',    icon: Server,          group: 'Infrastructure' },

  // Content
  { id: 'cms',         label: 'CMS Platform',             desc: 'Pages, posts, blocks, templates',        href: '/cms',               icon: FileText,        group: 'Content' },
  { id: 'media',       label: 'Media Library',            desc: 'Files, images, CDN management',          href: '/media',             icon: Image,           group: 'Content' },

  // Commerce
  { id: 'commerce',    label: 'Commerce',                 desc: 'Products, orders, inventory',            href: '/commerce',          icon: Package,         group: 'Commerce' },
  { id: 'payments',    label: 'Payments',                 desc: 'Transactions, subscriptions, refunds',   href: '/payments',          icon: CreditCard,      group: 'Commerce' },

  // Operations
  { id: 'notifs',      label: 'Notifications',            desc: 'Email, SMS, push, webhooks',             href: '/notifications',     icon: Bell,            group: 'Operations' },
  { id: 'support',     label: 'Support Center',           desc: 'Tickets, live chat, customer timeline',  href: '/support',           icon: Headphones,      group: 'Operations' },

  // AI
  { id: 'ai',          label: 'AI Operations',            desc: 'Models, agents, prompts, pipelines',     href: '/ai',                icon: Bot,             group: 'AI', badge: 'Beta' },

  // Developers
  { id: 'developers',  label: 'Developer Platform',       desc: 'API docs, SDKs, webhooks, changelog',    href: '/developers',        icon: Code2,           group: 'Developers' },

  // System
  { id: 'flags',       label: 'Feature Flags',            desc: 'Staged rollouts & kill switches',        href: '/feature-flags',     icon: ToggleLeft,      group: 'System' },
  { id: 'settings',    label: 'Platform Settings',        desc: 'Auth, SMTP, DNS, billing, branding',     href: '/settings',          icon: Settings,        group: 'System' },
];

const ACTION_COMMANDS: Cmd[] = [
  { id: 'new-user',      label: 'Create User',            icon: Users,        group: 'Actions', href: '/users?action=create',         keywords: ['add user','invite'] },
  { id: 'new-org',       label: 'Create Organization',    icon: Building2,    group: 'Actions', href: '/organizations?action=create'  },
  { id: 'new-post',      label: 'Create CMS Post',        icon: FileText,     group: 'Actions', href: '/cms/posts?action=create'      },
  { id: 'new-page',      label: 'Create CMS Page',        icon: Globe,        group: 'Actions', href: '/cms/pages?action=create'      },
  { id: 'new-flag',      label: 'Create Feature Flag',    icon: ToggleLeft,   group: 'Actions', href: '/feature-flags?action=create'  },
  { id: 'new-webhook',   label: 'Create Webhook',         icon: Webhook,      group: 'Actions', href: '/developers?tab=webhooks&action=create' },
  { id: 'revoke-tokens', label: 'Revoke All Tokens',      icon: Lock,         group: 'Actions', href: '/identity?action=revoke-tokens' },
  { id: 'kill-session',  label: 'Kill Session',           icon: Monitor,      group: 'Actions', href: '/sessions?action=kill'         },
];

const ALL_COMMANDS = [...NAV_COMMANDS, ...ACTION_COMMANDS];

export default function CommandPalette() {
  const router   = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const wsState  = useRealtimeStore((s) => s.wsState);
  const services = useRealtimeStore((s) => s.services);
  const [search, setSearch] = useState('');

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCommandPaletteOpen(!commandPaletteOpen);
    }
    if (e.key === 'Escape') setCommandPaletteOpen(false);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const runCommand = (cmd: Cmd) => {
    setCommandPaletteOpen(false);
    setSearch('');
    if (cmd.action) cmd.action();
    else if (cmd.href) router.push(cmd.href);
  };

  const groups = [...new Set(ALL_COMMANDS.map((c) => c.group))];

  const downServices = services.filter((s) => s.status === 'down').length;

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={(o) => { setCommandPaletteOpen(o); if (!o) setSearch(''); }}>
      <DialogContent className="p-0 max-w-2xl overflow-hidden gap-0">
        <Command
          shouldFilter={true}
          className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input]]:h-13 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4"
        >
          {/* Search bar */}
          <div className="flex items-center border-b px-3 gap-2">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search pages, actions, users..."
              className="flex h-13 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center gap-2 shrink-0">
              {wsState === 'connected' ? (
                <span className="flex items-center gap-1 text-xs text-green-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Offline</span>
              )}
              {downServices > 0 && (
                <Badge variant="destructive" className="text-xs h-5 px-1.5">
                  {downServices} down
                </Badge>
              )}
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                ESC
              </kbd>
            </div>
          </div>

          {/* Results */}
          <Command.List className="max-h-[500px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No results for &ldquo;{search}&rdquo;
            </Command.Empty>

            {groups.map((group) => {
              const cmds = ALL_COMMANDS.filter((c) => c.group === group);
              return (
                <Command.Group key={group} heading={group}>
                  {cmds.map((cmd) => (
                    <Command.Item
                      key={cmd.id}
                      value={[cmd.label, cmd.desc, ...(cmd.keywords ?? [])].join(' ')}
                      onSelect={() => runCommand(cmd)}
                      className="flex items-center gap-3 rounded-md cursor-pointer aria-selected:bg-accent"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
                        <cmd.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none mb-0.5">{cmd.label}</p>
                        {cmd.desc && <p className="text-xs text-muted-foreground truncate">{cmd.desc}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {cmd.badge && (
                          <Badge variant={cmd.badgeVariant ?? 'secondary'} className="text-[10px] h-4 px-1">
                            {cmd.badge}
                          </Badge>
                        )}
                        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-aria-selected:opacity-100" />
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>

          {/* Footer */}
          <div className="border-t px-3 py-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><kbd className="font-mono bg-muted rounded px-1">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="font-mono bg-muted rounded px-1">↵</kbd> open</span>
            <span className="flex items-center gap-1"><kbd className="font-mono bg-muted rounded px-1">⌘K</kbd> toggle</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
