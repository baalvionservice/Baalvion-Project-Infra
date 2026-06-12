'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ShoppingBag,
  Heart,
  Settings,
  ArrowRight,
  ShieldCheck,
  Package,
  ChevronRight,
  RotateCcw,
  MapPin,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { useAppStore } from '@/lib/store';
import { orderApi } from '@/lib/api-client';

/**
 * Account overview — driven by the REAL authenticated user (src/lib/auth-context)
 * and the user's REAL orders (order-service /orders/mine). No mock identity, no
 * fabricated portfolio/appreciation numbers.
 */
export default function AccountDashboard() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const { user } = useAuth();
  const { wishlist } = useAppStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await orderApi.mine({ pageSize: 5 });
      if (cancelled) return;
      setOrders(res.ok ? res.data.items ?? [] : []);
      setOrdersLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = user?.name?.trim()?.split(' ')[0] || 'there';
  const wishlistCount = wishlist?.length ?? 0;

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="flex flex-wrap justify-between items-end gap-6 border-b border-border pb-10">
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-plum">
            Maison Account
          </span>
          <h1 className="text-4xl md:text-5xl font-headline font-bold italic text-gray-900 tracking-tight leading-none">
            Bonjour, {firstName}
          </h1>
          <p className="text-sm text-gray-500 font-light italic">{user?.email}</p>
        </div>
        <Badge
          variant="outline"
          className="bg-plum/5 text-plum border-plum/20 h-9 px-5 rounded-none text-[10px] font-bold uppercase tracking-widest"
        >
          {user?.emailVerified ? 'Verified Member' : 'Member'}
        </Badge>
      </header>

      {/* Real stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          label="Acquisitions"
          value={ordersLoading ? '—' : String(orders.length)}
          icon={<ShoppingBag className="w-5 h-5 text-plum" />}
          href={`/${countryCode}/account/acquisitions`}
        />
        <StatCard
          label="Private Archive"
          value={String(wishlistCount)}
          icon={<Heart className="w-5 h-5 text-plum" />}
          href={`/${countryCode}/account/wishlist`}
        />
        <StatCard
          label="Account Status"
          value={user?.status === 'active' || !user?.status ? 'Active' : user.status}
          icon={<ShieldCheck className="w-5 h-5 text-green-600" />}
          href={`/${countryCode}/account/settings`}
        />
      </div>

      {/* Recent acquisitions (real orders) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">
            Recent Acquisitions
          </h3>
          <Link
            href={`/${countryCode}/account/acquisitions`}
            className="text-[10px] font-bold uppercase tracking-widest text-plum hover:text-gold transition-colors inline-flex items-center"
          >
            View all <ArrowRight className="ml-2 w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white border border-border shadow-sm overflow-hidden">
          {ordersLoading ? (
            <div className="py-16 text-center opacity-40">
              <p className="text-[10px] font-bold uppercase tracking-widest italic">Loading…</p>
            </div>
          ) : orders.length > 0 ? (
            <div className="divide-y divide-border">
              {orders.slice(0, 3).map((o) => (
                <div
                  key={o.id}
                  className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-6">
                    <div className="w-10 h-12 bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-tight text-gray-900">
                        {o.orderNumber || 'Order'}
                      </p>
                      <p className="text-[9px] text-gray-400 font-mono">
                        {new Date(o.createdAt).toLocaleDateString()} ·{' '}
                        {(o.currencyCode || o.currency || '').toUpperCase()}{' '}
                        {Number(o.totalAmount ?? o.total ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[8px] uppercase tracking-widest">
                    {o.status || 'pending'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 italic">
                No acquisitions yet
              </p>
              <Link
                href={`/${countryCode}`}
                className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-plum hover:text-gold transition-colors"
              >
                Explore the Maison <ChevronRight className="ml-1 w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Quick links to the real sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickLink label="Acquisitions" desc="Order history & status" href={`/${countryCode}/account/acquisitions`} icon={<ShoppingBag className="w-4 h-4" />} />
        <QuickLink label="Returns" desc="Request & track returns" href={`/${countryCode}/account/returns`} icon={<RotateCcw className="w-4 h-4" />} />
        <QuickLink label="Addresses" desc="Shipping & billing details" href={`/${countryCode}/account/addresses`} icon={<MapPin className="w-4 h-4" />} />
        <QuickLink label="Private Archive" desc="Your saved pieces" href={`/${countryCode}/account/wishlist`} icon={<Heart className="w-4 h-4" />} />
        <QuickLink label="Identity" desc="Profile & security" href={`/${countryCode}/account/settings`} icon={<Settings className="w-4 h-4" />} />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="bg-white border-border shadow-sm p-8 space-y-6 group hover:border-plum transition-all rounded-none cursor-pointer">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-plum transition-colors">
            {label}
          </span>
          {icon}
        </div>
        <div className="text-4xl font-body font-bold italic text-gray-900 leading-none">{value}</div>
      </Card>
    </Link>
  );
}

function QuickLink({
  label,
  desc,
  href,
  icon,
}: {
  label: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <div className="p-6 bg-ivory border border-border hover:border-plum transition-all group cursor-pointer flex items-center space-x-4">
        <div className="p-2 bg-white border border-border text-plum">{icon}</div>
        <div>
          <p className="text-xs font-bold uppercase tracking-tight text-gray-900 group-hover:text-plum transition-colors">
            {label}
          </p>
          <p className="text-[10px] text-gray-400 font-light italic">{desc}</p>
        </div>
      </div>
    </Link>
  );
}
