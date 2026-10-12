'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Copy, UserPlus, ShieldCheck, Smartphone, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import ScopeTeamPanel from '@/components/rbac/ScopeTeamPanel';
import InviteToWebsitesButton from '@/components/cms/InviteToWebsitesButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRbacRoleMap } from '@/lib/queries/rbac.queries';
import { STORE_TEAM_ROLE_KEYS } from '@/lib/types/rbac.types';
import type { RbacRole } from '@/lib/types/rbac.types';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { useUIStore } from '@/lib/store/uiStore';

const CAN = [
  'Add products with photos, price, colour and category',
  'Change prices and photos of existing products',
  'Add sizes and publish or take products off the website',
  'Add and organise categories and brands in this store',
];
const CANNOT = [
  'See or change any other store or website',
  'See revenue, payments or billing',
  'Add or remove people, or change anyone’s access',
  'Use your login. Never share your own password.',
];

const helperMessage = (storeName: string) => `Hi! You now have access to add products for ${storeName}.

On your phone:
1. Open admin.baalvion.com and sign in (use the email you were invited with).
2. Tap the menu, then Commerce, then Products.
3. Tap the blue "Quick add" button.
4. Take or choose photos, type the name, pick the category, enter the price.
5. Tap "Save as draft". When all four steps are ticked you can tap "Save & publish".

Please only enter real details: the real colour, a true description, the confirmed price and your own photos of the actual item. Never use placeholder text such as "TBD".
If something does not work, send me a screenshot.`;

export default function ShopTeamGuidePage() {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  const { activeStore } = useCommerceStore();
  const { roleByKey } = useRbacRoleMap();
  const roleOptions = useMemo(
    () => STORE_TEAM_ROLE_KEYS.map((k) => roleByKey.get(k)).filter((r): r is RbacRole => !!r),
    [roleByKey],
  );
  useEffect(() => { setBreadcrumbs([{ label: 'Commerce', href: '/commerce' }, { label: 'Hand over work' }]); }, [setBreadcrumbs]);

  const storeName = activeStore?.name ?? 'Amarisé Maison Avenue';
  const isAmarise = activeStore?.code?.toLowerCase() === 'amarise';
  const teamHref = activeStore ? `/rbac/${encodeURIComponent(activeStore.countryCode)}/${activeStore.id}` : '/rbac';

  const copy = async () => {
    try { await navigator.clipboard.writeText(helperMessage(storeName)); toast.success('Copied. Paste it into WhatsApp or email.'); }
    catch { toast.error('Could not copy. Select the text and copy it by hand.'); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Hand over shop work" description={`Let someone add and price products for ${storeName}, and nothing else.`} />

      {activeStore && !isAmarise && (
        <Card className="border-amber-400/60 bg-amber-50 dark:bg-amber-500/10">
          <CardContent className="flex gap-3 py-4 text-sm">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p>The selected store is <strong>{activeStore.name}</strong>, not Amarisé (US). Switch the store in the bar at the top of Commerce before you assign anyone.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm text-primary">1</span>Invite them</CardTitle>
          <CardDescription>If they already have an account on this platform, skip to step 2.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Enter their email. They receive an invitation and create their sign-in from it. Choose <strong>only Amarisé Maison Avenue</strong> in the list so they cannot see any other website.</p>
          <InviteToWebsitesButton size="sm" label="Invite a helper" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm text-primary">2</span>Give them the shop role</CardTitle>
          <CardDescription>This is what limits them to this one store.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>In the panel below, click <strong>Assign role</strong>, find their name or email, and choose <strong>Product manager</strong>.</p>
          {roleOptions.length > 0 && activeStore ? (
            <ScopeTeamPanel
              scopeId={activeStore.id}
              scopeLabel={activeStore.name}
              roleOptions={roleOptions}
              title="Who works on this store"
              description="Product managers can add and price products in this store only."
            />
          ) : (
            <p className="text-muted-foreground">The team list is loading, or this account cannot manage teams. <Link href={teamHref} className="text-primary underline">Open Team Management</Link>.</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 font-medium"><CheckCircle2 className="h-4 w-4 text-green-600" />They can</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">{CAN.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 font-medium"><XCircle className="h-4 w-4 text-destructive" />They cannot</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">{CANNOT.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm text-primary">3</span>Check they can open Commerce</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Commerce appears only for people whose console role is <strong className="text-foreground">Manager or higher</strong>. New sign-ups are normally already high enough. If the Commerce menu is missing for them, set their role on the <Link href="/people" className="text-primary underline">People page</Link>.</p>
          <p>Access starts the next time they sign in. If it doesn&apos;t show, ask them to sign out and back in.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm text-primary">4</span><Smartphone className="h-4 w-4" />Send them the instructions</CardTitle>
          <CardDescription>A ready message with the exact steps for their phone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs leading-relaxed">{helperMessage(storeName)}</pre>
          <Button size="sm" onClick={copy}><Copy className="mr-2 h-4 w-4" />Copy message</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" />Check their first product</CardTitle></CardHeader>
        <CardContent className="space-y-1.5 text-sm text-muted-foreground">
          <p>Ask them to add one product as a <strong className="text-foreground">draft</strong> first. Open it under <Link href="/commerce/products" className="text-primary underline">Products</Link>, check the photo, name, category and price, then publish it yourself. After that they can publish their own.</p>
          <p>To end their access at any time, remove them from the panel in step 2. They keep their account but lose the shop.</p>
        </CardContent>
      </Card>
    </div>
  );
}
