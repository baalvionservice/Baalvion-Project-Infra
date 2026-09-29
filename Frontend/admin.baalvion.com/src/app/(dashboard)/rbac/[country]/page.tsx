'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Store, ArrowRight, Loader2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ScopeTeamPanel from '@/components/rbac/ScopeTeamPanel';
import { useRbacCountries, useRbacStoresUnder, useRbacRoleMap } from '@/lib/queries/rbac.queries';
import { useCommerceStores } from '@/lib/queries/commerce-stores.queries';
import { COUNTRY_ADMIN_ROLE_KEY } from '@/lib/types/rbac.types';
import { useUIStore } from '@/lib/store/uiStore';

// Country Detail: the country's administrators + the stores under it (from the RBAC tenant tree).
// Commerce is used ONLY for read-only store name metadata.
export default function RbacCountryDetailPage() {
  const params = useParams<{ country: string }>();
  const code = decodeURIComponent(params.country);
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);

  const { data: countries } = useRbacCountries();
  const country = useMemo(
    () => (countries ?? []).find((c) => c.externalRef === code || c.id === code),
    [countries, code],
  );

  const { roleByKey } = useRbacRoleMap();
  const countryAdminRole = roleByKey.get(COUNTRY_ADMIN_ROLE_KEY);

  const { data: storeTenants, isLoading: storesLoading } = useRbacStoresUnder(country?.id);
  const { data: commerceStores } = useCommerceStores({ limit: 200 });

  const storeMetaById = useMemo(() => {
    const map = new Map<string, { name: string; code?: string }>();
    for (const store of commerceStores?.data ?? []) map.set(store.id, { name: store.name, code: store.code });
    return map;
  }, [commerceStores]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Team Management', href: '/rbac' },
      { label: country?.name ?? code },
    ]);
  }, [setBreadcrumbs, country, code]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={country?.name ?? code}
        description="Country administrators and the stores under this country."
      />

      <ScopeTeamPanel
        scopeId={code}
        scopeLabel={country?.name ?? code}
        roleOptions={countryAdminRole ? [countryAdminRole] : []}
        title="Country administrators"
        description="Manages every store in this country."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stores</CardTitle>
          <CardDescription>Stores mapped under this country in RBAC.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {storesLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading stores…
            </div>
          ) : (storeTenants ?? []).length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={Store}
                title="No stores under this country"
                description="Create a store for this country in Commerce; it is mirrored into RBAC automatically."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Store ID</TableHead>
                  <TableHead className="w-32 text-right">Team</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(storeTenants ?? []).map((tenant) => {
                  const storeId = tenant.externalRef ?? tenant.id;
                  const meta = storeMetaById.get(storeId);
                  return (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">
                        {meta?.name ?? tenant.name}
                        {meta?.code && <Badge variant="outline" className="ml-2 font-mono text-xs">{meta.code}</Badge>}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{storeId}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/rbac/${encodeURIComponent(code)}/${encodeURIComponent(storeId)}`}>
                            Manage <ArrowRight className="ml-1.5 h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
