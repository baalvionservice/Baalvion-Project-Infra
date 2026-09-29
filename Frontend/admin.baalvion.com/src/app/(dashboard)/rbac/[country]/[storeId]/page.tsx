'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import ScopeTeamPanel from '@/components/rbac/ScopeTeamPanel';
import { useRbacCountries, useRbacRoleMap } from '@/lib/queries/rbac.queries';
import { useCommerceStores } from '@/lib/queries/commerce-stores.queries';
import { STORE_TEAM_ROLE_KEYS } from '@/lib/types/rbac.types';
import type { RbacRole } from '@/lib/types/rbac.types';
import { useUIStore } from '@/lib/store/uiStore';

// Store Team: manage store-level roles (product_manager / seo_manager / ops_manager /
// store_admin / store_viewer) for one store. Assign/revoke + effective permissions, RBAC-only.
export default function RbacStoreTeamPage() {
  const params = useParams<{ country: string; storeId: string }>();
  const code = decodeURIComponent(params.country);
  const storeId = decodeURIComponent(params.storeId);
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);

  const { roleByKey } = useRbacRoleMap();
  const roleOptions = useMemo(
    () => STORE_TEAM_ROLE_KEYS.map((key) => roleByKey.get(key)).filter((r): r is RbacRole => !!r),
    [roleByKey],
  );

  const { data: countries } = useRbacCountries();
  const country = (countries ?? []).find((c) => c.externalRef === code || c.id === code);

  const { data: commerceStores } = useCommerceStores({ limit: 200 });
  const store = (commerceStores?.data ?? []).find((s) => s.id === storeId);
  const storeName = store?.name ?? `Store ${storeId}`;

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Team Management', href: '/rbac' },
      { label: country?.name ?? code, href: `/rbac/${encodeURIComponent(code)}` },
      { label: storeName },
    ]);
  }, [setBreadcrumbs, country, code, storeName]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={storeName}
        description={`Store team for ${country?.name ?? code}. Assign product, SEO, operations and admin roles.`}
      />

      <ScopeTeamPanel
        scopeId={storeId}
        scopeLabel={storeName}
        roleOptions={roleOptions}
        title="Store team"
        description="Product, SEO, operations, admin and viewer roles scoped to this store."
      />
    </div>
  );
}
