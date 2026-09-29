
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Search,
  Briefcase,
  Wallet,
  MessageSquare,
  Settings,
  FileText,
  UserCircle,
  Zap,
  ArrowLeftRight,
  BarChart3,
  ImageIcon,
  IndianRupee,
  Users,
  LineChart,
  UserPlus,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  History,
  Scale,
  Megaphone,
  Cpu,
  LifeBuoy,
  FileBarChart,
  FileBadge,
  LogOut,
  Trophy,
  Activity,
  Fingerprint,
  PieChart,
  Target,
  TrendingUp,
  FileBox
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { hasAccess } from '@/lib/billing';

interface SidebarProps {
  mockRole?: 'BRAND' | 'CREATOR' | 'ADMIN';
  onToggleRole?: () => void;
}

export function DashboardSidebar({ mockRole, onToggleRole }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, signOut } = useAuth();

  const currentRole = currentUser?.role || mockRole || 'BRAND';
  const userPlan = currentUser?.role === 'BRAND' ? (currentUser as any).plan || 'STARTER' : 'STARTER';

  const creatorLinks = [
    { name: 'Dashboard', href: '/dashboard/creator', icon: LayoutDashboard, id: 'sidebar-dashboard' },
    { name: 'Analytics', href: '/dashboard/creator/analytics', icon: BarChart3, id: 'sidebar-analytics' },
    { name: 'Portfolio', href: '/dashboard/creator/portfolio', icon: ImageIcon, id: 'sidebar-portfolio' },
    { name: 'Rate Card', href: '/dashboard/creator/rates', icon: IndianRupee, id: 'sidebar-rates' },
    { name: 'Find Campaigns', href: '/dashboard/creator/campaigns', icon: Search, id: 'sidebar-campaigns' },
    { name: 'My Applications', href: '/dashboard/applications', icon: Briefcase, id: 'sidebar-apps' },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy, id: 'sidebar-leaderboard' },
    { name: 'Wallet', href: '/dashboard/creator/wallet', icon: Wallet, id: 'sidebar-wallet' },
    { name: 'Messages', href: '/dashboard/creator/messages', icon: MessageSquare, id: 'sidebar-messages' },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, id: 'sidebar-settings' },
  ];

  const brandLinks = [
    { name: 'Dashboard', href: '/dashboard/brand', icon: LayoutDashboard, id: 'sidebar-dashboard' },
    { name: 'Performance', href: '/dashboard/brand/analytics', icon: LineChart, id: 'sidebar-analytics' },
    { name: 'My Campaigns', href: '/dashboard/brand/campaigns', icon: Briefcase, id: 'sidebar-campaigns' },
    { name: 'Find Creators', href: '/dashboard/brand/creators', icon: Users, id: 'sidebar-creators' },
    { name: 'Deliverables', href: '/dashboard/brand/deliverables', icon: FileText, id: 'sidebar-deliverables' },
    { name: 'Team Hub', href: '/dashboard/brand/team', icon: UserPlus, id: 'sidebar-team', feature: 'TEAM_MANAGEMENT' as const },
    { name: 'Tax & Compliance', href: '/dashboard/brand/tax', icon: FileBadge, id: 'sidebar-tax' },
    { name: 'Billing & Plans', href: '/dashboard/brand/billing', icon: CreditCard, id: 'sidebar-billing' },
    { name: 'Wallet', href: '/dashboard/brand/wallet', icon: Wallet, id: 'sidebar-wallet' },
    { name: 'Messages', href: '/dashboard/brand/messages', icon: MessageSquare, id: 'sidebar-messages' },
    { name: 'Settings', href: '/dashboard/brand/settings', icon: Settings, id: 'sidebar-settings' },
  ];

  const adminLinks = [
    { name: 'Admin Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'CRM Pipeline', href: '/admin/leads', icon: Target },
    { name: 'Sales Pipeline', href: '/admin/deals', icon: TrendingUp },
    { name: 'Proposals', href: '/admin/proposals', icon: FileBox },
    { name: 'Workflow Logic', href: '/admin/automation', icon: Zap },
    { name: 'Brand Acquisition', href: '/admin/acquisition', icon: Search },
    { name: 'Outreach Manager', href: '/admin/outreach', icon: Megaphone },
    { name: 'Platform Analytics', href: '/admin/analytics', icon: PieChart },
    { name: 'User Directory', href: '/admin/users', icon: Users },
    { name: 'Verification Queue', href: '/admin/creators/verify', icon: ShieldCheck },
    { name: 'Campaign Moderation', href: '/admin/campaigns', icon: ShieldAlert },
    { name: 'Content Safety', href: '/admin/content', icon: ShieldAlert },
    { name: 'Fraud Shield', href: '/admin/fraud', icon: Fingerprint },
    { name: 'Financial Control', href: '/admin/finance', icon: IndianRupee },
    { name: 'Economics & Tiers', href: '/admin/plans', icon: CreditCard },
    { name: 'AI Monitoring', href: '/admin/ai', icon: Cpu },
    { name: 'Mediation Hub', href: '/admin/disputes', icon: Scale },
    { name: 'Broadcast Center', href: '/admin/notifications', icon: Megaphone },
    { name: 'Reports & Export', href: '/admin/reports', icon: FileBarChart },
    { name: 'Audit Ledger', href: '/admin/audit', icon: History },
    { name: 'Support Center', href: '/admin/support', icon: LifeBuoy },
    { name: 'Global Settings', href: '/admin/settings', icon: Settings },
  ];

  const rawLinks = currentRole === 'ADMIN' ? adminLinks : currentRole === 'BRAND' ? brandLinks : creatorLinks;

  // Filter links based on plan feature gating
  const links = rawLinks.filter(link => {
    if (currentRole === 'BRAND' && 'feature' in link) {
      return hasAccess(userPlan, link.feature as any);
    }
    return true;
  });

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r bg-white shadow-sm z-30" aria-label="Main Navigation">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center h-16 flex-shrink-0 px-6 border-b justify-between">
          <Link href="/" className="flex items-center" aria-label="Baalvion Connect Home">
            <div className="bg-primary p-1.5 rounded-lg mr-2">
              <Zap className="h-5 w-5 text-white fill-current" aria-hidden="true" />
            </div>
            <span className="font-headline font-bold text-lg tracking-tight text-slate-900">Baalvion</span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
          <nav className="flex-1 px-4 py-6 space-y-1">
            {links.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    isActive
                      ? 'bg-primary/5 text-primary shadow-sm ring-1 ring-primary/10'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                    'group flex items-center px-3 py-2.5 text-sm font-bold rounded-xl transition-all duration-200'
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600',
                      'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex-shrink-0 p-4 space-y-3 border-t bg-slate-50/50">
          {onToggleRole && currentRole !== 'ADMIN' && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-[10px] h-9 font-black border-dashed bg-white tracking-widest"
              onClick={onToggleRole}
              aria-label={`Switch to ${currentRole === 'BRAND' ? 'Creator' : 'Brand'} view`}
            >
              <ArrowLeftRight className="h-3 w-3 mr-2 text-primary" aria-hidden="true" />
              SWITCH TO {currentRole === 'BRAND' ? 'CREATOR' : 'BRAND'} VIEW
            </Button>
          )}

          <div className="bg-white rounded-2xl p-4 border shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Account Control
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs uppercase border border-primary/20" aria-hidden="true">
                {currentRole === 'ADMIN' ? 'A' : currentRole === 'BRAND' ? 'L' : 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {currentRole === 'ADMIN' ? 'Admin Access' : currentUser?.displayName || 'User'}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter truncate">
                  {currentRole === 'ADMIN' ? 'Platform Root' : currentRole === 'BRAND' ? `${userPlan} Plan` : 'Verified Pro'}
                </p>
              </div>
              <button
                onClick={() => signOut()}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                aria-label="Log out of session"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
