"use client"

import { useAdminAccess, requirementFor } from "@/components/admin/admin-access"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard,
  Users,
  Globe,
  ShoppingBag, 
  CreditCard, 
  ShieldCheck,
  Database,
  Lock,
  ChevronRight,
  LogOut,
  FolderTree,
  ShoppingCart,
  ClipboardCheck,
  ClipboardList,
  FileCheck,
  RotateCcw,
  Tag,
  MapPin,
  MessageSquare,
  Megaphone,
  AlertOctagon,
  Scale,
  Award,
  Wallet,
  Bitcoin,
  Percent,
  LifeBuoy,
  Undo2,
  Video,
  GraduationCap,
  Fingerprint,
  Radio,
  ScrollText,
  Ticket,
  Star,
  Crown,
  Search,
  ChevronDown,
  PlusCircle
} from "lucide-react"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"

const ADMIN_NAV = [
  {
    group: "OVERVIEW",
    items: [
      { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
      { name: "Regional Analytics", path: "/admin/analytics", icon: Globe },
    ]
  },
  {
    group: "SELLERS & LISTINGS",
    items: [
      { name: "Add a Listing", path: "/seller/listings/new", icon: PlusCircle },
      { name: "Seller Applications", path: "/admin/seller-applications", icon: ClipboardCheck },
      { name: "Listing Moderation", path: "/admin/moderation", icon: FileCheck },
      { name: "Seller Marketplace", path: "/admin/sellers", icon: ShieldCheck },
      { name: "Listing Oversight", path: "/admin/marketplace", icon: ShoppingBag },
      { name: "Categories", path: "/admin/categories", icon: FolderTree },
      { name: "Seller Chat", path: "/admin/seller-chat", icon: MessageSquare },
      { name: "Seller Payments", path: "/admin/seller-payments", icon: Wallet },
      { name: "Seller Notice", path: "/admin/seller-notice", icon: Megaphone },
    ]
  },
  {
    group: "ORDERS & MONEY",
    items: [
      { name: "Order Management", path: "/admin/orders", icon: ClipboardList },
      { name: "Returns", path: "/admin/returns", icon: RotateCcw },
      { name: "Live Carts", path: "/admin/carts", icon: ShoppingCart },
      { name: "Discount Codes", path: "/admin/discounts", icon: Tag },
      { name: "Payment Settings", path: "/admin/payment-settings", icon: CreditCard },
      { name: "Payment Addresses", path: "/admin/payment-addresses", icon: Bitcoin },
      { name: "Wallet Receipts", path: "/admin/points", icon: Wallet },
      { name: "Intermediary Oversight", path: "/escrow/admin-dashboard", icon: ShieldCheck },
      { name: "Commission Tiers", path: "/admin/marketplace/commissions", icon: Percent },
    ]
  },
  {
    group: "PEOPLE & VERIFICATION",
    items: [
      { name: "People (buyers, sellers, staff)", path: "/admin/users", icon: Users },
      { name: "Identity KYC", path: "/admin/kyc", icon: Fingerprint },
      { name: "Department Requests", path: "/admin/access-requests", icon: MessageSquare },
      { name: "Dating Profiles", path: "/admin/dating", icon: MessageSquare },
      { name: "Investment Listings", path: "/admin/investments", icon: Tag },
      { name: "Staff & Access", path: "/admin/staff", icon: ShieldCheck },
    ]
  },
  {
    group: "COMMUNITY",
    items: [
      { name: "Thread Queue", path: "/admin/forum/queue", icon: Scale },
      { name: "Warn & Strike System", path: "/admin/forum/strikes", icon: AlertOctagon },
      { name: "Rank & Badges", path: "/admin/forum/badges", icon: Award },
      { name: "Manage Listings", path: "/admin/locals", icon: MapPin },
      { name: "Applications Inbox", path: "/admin/locals/applications", icon: MessageSquare },
      { name: "Post Casting Call", path: "/admin/locals/new", icon: Megaphone },
      { name: "Page Content and SEO", path: "/admin/content", icon: Tag },
    ]
  },
  {
    group: "NIGHTLIFE",
    items: [
      { name: "Clubs Directory", path: "/admin/clubs", icon: MapPin },
      { name: "Events Calendar", path: "/admin/clubs/events", icon: MapPin },
      { name: "Ticket Draws", path: "/admin/clubs/lottery", icon: Star },
      { name: "DJ Demands", path: "/admin/clubs/dj-demands", icon: Star },
      { name: "Guest List & VIP Requests", path: "/admin/clubs/bookings", icon: MessageSquare },
      { name: "Elite Hosted Parties", path: "/admin/clubs/elite-host", icon: Crown },
    ]
  },
  {
    group: "SUPPORT & LEARNING",
    items: [
      { name: "Support Tickets", path: "/admin/support/tickets", icon: LifeBuoy },
      { name: "Teacher Approvals", path: "/admin/education/approvals", icon: GraduationCap },
      { name: "Sessions", path: "/admin/education/live", icon: Video },
      { name: "Tasks, Reports & Inbox", path: "/admin/bounty", icon: ShieldCheck },
    ]
  },
  {
    group: "SYSTEM",
    items: [
      { name: "Global Announcements", path: "/admin/system/announcements", icon: Radio },
      { name: "Staff Audit Logs", path: "/admin/system/audit", icon: ScrollText },
      { name: "Security Node", path: "/admin/security", icon: Lock },
      { name: "System Logs", path: "/admin/forum/logs", icon: Database },
    ]
  }
];

export const AdminSidebar = () => {
  const pathname = usePathname();
  const { tier, can } = useAdminAccess();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ADMIN_NAV
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => can(requirementFor(item.path)) && (!q || item.name.toLowerCase().includes(q) || group.group.toLowerCase().includes(q))),
      }))
      .filter((group) => group.items.length > 0);
  }, [can, query]);

  const searching = query.trim().length > 0;

  return (
    <div className="flex flex-col h-full bg-[#050508] border-r border-white/5 w-72 fixed left-0 top-0 z-50">
      <div className="px-6 pt-6 pb-4 border-b border-white/5 space-y-4">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg">
            <span className="font-bold text-sm">HR</span>
          </div>
          <div>
            <span className="font-bold text-lg text-white block leading-tight">Hell Road Admin</span>
            <span className="text-xs font-semibold text-red-400">{tier === "super" ? "Super Admin" : tier === "admin" ? "Admin" : "Moderator"}</span>
          </div>
        </Link>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a page…"
            aria-label="Find an admin page"
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2 no-scrollbar">
        {visible.length === 0 && <p className="px-3 py-6 text-sm text-gray-500">No page matches &ldquo;{query}&rdquo;.</p>}
        {visible.map((group) => {
          const hasActive = group.items.some((i) => pathname === i.path)
          const isOpen = searching || (expanded[group.group] ?? (hasActive || group.group === "OVERVIEW"))
          return (
            <div key={group.group}>
              <button
                type="button"
                onClick={() => setExpanded((c) => ({ ...c, [group.group]: !isOpen }))}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-bold text-gray-500 hover:text-white uppercase tracking-widest"
              >
                <span>{group.group}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen ? "rotate-0" : "-rotate-90")} />
              </button>
              {isOpen && (
                <div className="space-y-0.5 mb-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all group",
                        pathname === item.path
                          ? "bg-red-600/10 text-red-400 border border-red-500/20"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <item.icon className={cn("w-4 h-4 shrink-0", pathname === item.path ? "text-red-400" : "text-gray-500 group-hover:text-white")} />
                      <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-white/5">
        <Link href="/">
          <button className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-bold">Sign out</span>
          </button>
        </Link>
      </div>
    </div>
  )
}
