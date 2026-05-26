"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Package,
  Zap,
  Target,
  Truck,
  CreditCard,
  ShieldCheck,
  FlaskConical,
  ChevronRight,
  LogOut,
  Activity,
  UserCircle,
  Award,
  ExternalLink,
  MapPin,
  Cpu,
  Lock,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useRBAC } from "@/hooks/use-rbac";
import { PERMISSIONS } from "@/lib/permissions/engine";

/**
 * AdminSidebar: Layered Institutional Navigation Matrix
 * Reacts to RBAC clearance levels to show/hide tactical nodes.
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const { country } = useParams();
  const { adminJurisdiction } = useAppStore();
  const { can } = useRBAC();
  const countryCode = (country as string) || "us";

  const menuGroups = [
    {
      title: "Tactical Layer 1 & 2",
      items: [
        {
          icon: <LayoutDashboard />,
          label: "Master Terminal",
          href: "/admin",
          permission: PERMISSIONS.READ,
        },
        {
          icon: <Globe />,
          label: "Global Matrix",
          href: "/admin/super",
          permission: PERMISSIONS.VIEW_GLOBAL_HUD,
        },
      ],
    },
    {
      title: "Tactical Layer 3",
      items: [
        {
          icon: <MapPin />,
          label: `${
            adminJurisdiction === "global"
              ? "USA"
              : adminJurisdiction.toUpperCase()
          } Hub`,
          href: `/admin/country/${
            adminJurisdiction === "global" ? "us" : adminJurisdiction
          }`,
          permission: PERMISSIONS.VIEW_COUNTRY_DASH,
        },
      ],
    },
    {
      title: "Tactical Layer 4",
      items: [
        {
          icon: <Package />,
          label: "Commerce Hub",
          href: "/admin/commerce",
          permission: PERMISSIONS.ACCESS_COMMERCE,
        },
        {
          icon: <CreditCard />,
          label: "Finance Hub",
          href: "/admin/finance",
          permission: PERMISSIONS.ACCESS_FINANCE,
        },
        {
          icon: <Truck />,
          label: "Logistics Matrix",
          href: "/admin/logistics",
          permission: PERMISSIONS.ACCESS_LOGISTICS,
        },
        {
          icon: <Zap />,
          label: "AI Control",
          href: "/admin/ai",
          permission: PERMISSIONS.ACCESS_AI,
        },
        {
          icon: <Activity />,
          label: "Observability",
          href: "/admin/observability",
          permission: PERMISSIONS.ACCESS_OBSERVABILITY,
        },
        {
          icon: <ShieldCheck />,
          label: "Audit Registry",
          href: "/admin/audit",
          permission: PERMISSIONS.ACCESS_AUDIT,
        },
      ],
    },
    {
      title: "Layer 5 & Support",
      items: [
        {
          icon: <Target />,
          label: "Sales CRM",
          href: "/admin/sales",
          permission: PERMISSIONS.ACCESS_CRM,
        },
        {
          icon: <UserCircle />,
          label: "Partner Portal",
          href: "/admin/vendor",
          permission: PERMISSIONS.ACCESS_VENDOR,
        },
        {
          icon: <FlaskConical />,
          label: "Automation Lab",
          href: "/admin/qa",
          permission: PERMISSIONS.ACCESS_AUTOMATION,
        },
      ],
    },
  ];

  return (
    <aside className="w-72 bg-[#0A0A0B] border-r border-white/5 flex flex-col z-50 h-full shrink-0">
      <div className="p-10 border-b border-white/5 bg-black">
        <Link href="/admin">
          <div className="font-headline text-3xl font-bold tracking-tighter text-white flex items-center group">
            AMARISÉ{" "}
            <span className="text-plum text-[10px] font-bold tracking-[0.4em] ml-2 opacity-60">
              CORE
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-6 py-10 space-y-12 custom-scrollbar">
        {menuGroups.map((group) => {
          const visibleItems = group.items.filter((item) =>
            can(item.permission)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-4">
              <h4 className="px-4 text-[9px] font-bold uppercase tracking-[0.3em] text-white/20">
                {group.title}
              </h4>
              <div className="space-y-1">
                {visibleItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <button
                      className={cn(
                        "w-full flex items-center space-x-4 px-4 py-3 rounded-none transition-all duration-500 text-[11px] group border-none bg-transparent outline-none cursor-pointer",
                        pathname === item.href
                          ? "bg-white/5 text-white border-l-2 border-plum"
                          : "text-white/40 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <span
                        className={cn(
                          "transition-transform duration-500 group-hover:scale-110",
                          pathname === item.href
                            ? "text-plum"
                            : "text-white/20 group-hover:text-white/60"
                        )}
                      >
                        {React.cloneElement(
                          item.icon as React.ReactElement<any>,
                          { size: 16 }
                        )}
                      </span>
                      <span className="flex-1 text-left tracking-widest uppercase font-bold">
                        {item.label}
                      </span>
                      {pathname === item.href && (
                        <ChevronRight className="w-3 h-3 text-plum" />
                      )}
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/5 space-y-2 bg-black">
        <Link href={`/${countryCode}`}>
          <button className="w-full flex items-center space-x-4 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-blue-400/60 hover:text-blue-400 transition-colors border-none bg-transparent outline-none cursor-pointer">
            <ExternalLink size={16} />
            <span>Maison Storefront</span>
          </button>
        </Link>
        <button
          onClick={() => (window.location.href = `/${countryCode}`)}
          className="w-full flex items-center space-x-4 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-500/40 hover:text-red-500 transition-colors border-none bg-transparent outline-none cursor-pointer"
        >
          <LogOut size={16} />
          <span>Exit Node</span>
        </button>
      </div>
    </aside>
  );
}
