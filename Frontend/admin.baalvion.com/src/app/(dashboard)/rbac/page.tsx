'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Globe2, ArrowRight, Loader2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import ScopeTeamPanel from '@/components/rbac/ScopeTeamPanel';
import { useRbacCountries, useRbacRoleMap } from '@/lib/queries/rbac.queries';
import { COUNTRY_ADMIN_ROLE_KEY } from '@/lib/types/rbac.types';
import { useUIStore } from '@/lib/store/uiStore';

// Country View: every country from the RBAC tenant hierarchy, with its country_admins
// assignable/revocable inline — purely via RBAC.
export default function RbacCountriesPage() {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  const { data: countries, isLoading } = useRbacCountries();
  const { roleByKey } = useRbacRoleMap();
  const countryAdminRole = roleByKey.get(COUNTRY_ADMIN_ROLE_KEY);
  const roleOptions = countryAdminRole ? [countryAdminRole] : [];

  useEffect(() => {
    setBreadcrumbs([{ label: 'Team Management' }]);
  }, [setBreadcrumbs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Country & Store Team Management"
        description="Assign country administrators and store teams. Powered entirely by RBAC."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading countries…
        </div>
      ) : (countries ?? []).length === 0 ? (
        <EmptyState
          icon={Globe2}
          title="No countries provisioned"
          description="Run the commerce RBAC provisioning script to create country tenants, then assign administrators here."
        />
      ) : (
        <div className="space-y-8">
          {(countries ?? []).map((country) => {
            const code = country.externalRef ?? country.id;
            return (
              <div key={country.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Globe2 className="h-4 w-4 text-muted-foreground" />
                    {country.name}
                    <span className="font-mono text-xs text-muted-foreground">{code}</span>
                  </h3>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/rbac/${encodeURIComponent(code)}`}>
                      View stores <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <ScopeTeamPanel
                  scopeId={code}
                  scopeLabel={country.name}
                  roleOptions={roleOptions}
                  title="Country administrators"
                  description="A country admin manages every store in this country."
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
