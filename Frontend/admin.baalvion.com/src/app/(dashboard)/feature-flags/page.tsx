'use client';

import { useState, useEffect } from 'react';
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeatureFlags, useToggleFlag, useCreateFlag } from '@/lib/queries/feature-flags.queries';
import CreateDialog from '@/components/common/CreateDialog';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';
import type { FeatureFlag } from '@/lib/api/feature-flags';

function FlagCard({ flag }: { flag: FeatureFlag }) {
  const { mutate: toggle } = useToggleFlag();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm">{flag.name}</p>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{flag.key}</code>
            </div>
            {flag.description && (
              <p className="text-xs text-muted-foreground mb-2">{flag.description}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {flag.environments.map((env) => (
                <Badge key={env} variant="outline" className="text-xs">{env}</Badge>
              ))}
              {flag.rolloutPercent < 100 && (
                <Badge variant="secondary" className="text-xs">
                  {flag.rolloutPercent}% rollout
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-muted-foreground hidden sm:block">
              Updated {formatDate(flag.updatedAt)}
            </span>
            <Switch
              checked={flag.enabled}
              onCheckedChange={(checked) => toggle({ id: flag.id, enabled: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FeatureFlagsPage() {
  const { setBreadcrumbs } = useUIStore();
  const { data: flags, isLoading } = useFeatureFlags();
  const createFlag = useCreateFlag();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Feature Flags' }]);
  }, [setBreadcrumbs]);

  return (
    <div>
      <PageHeader
        title="Feature Flags"
        description="Control feature rollouts and experiments"
        actions={
          <CreateDialog
            trigger={<><Plus className="mr-2 h-4 w-4" />New Flag</>}
            triggerProps={{ size: 'sm' }}
            title="New feature flag"
            description="Starts switched off. Turn it on from the list when you are ready to roll out."
            successMessage="Feature flag created"
            fields={[
              { name: 'key', label: 'Key', required: true, placeholder: 'checkout.new_payment_flow', help: 'Lowercase letters, numbers, dots, dashes and underscores. Code refers to this key, so it cannot change later.', maxLength: 80, validate: (v) => (/^[a-z0-9][a-z0-9._-]*$/.test(v) ? null : 'Use lowercase letters, numbers, . - _ only') },
              { name: 'name', label: 'Name', required: true, placeholder: 'New payment flow', maxLength: 120 },
              { name: 'description', label: 'What it controls', type: 'textarea', maxLength: 500 },
            ]}
            onSubmit={(v) => createFlag.mutateAsync({ key: v.key, name: v.name, description: v.description || undefined, enabled: false, rolloutPercent: 0 })}
          />
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !flags?.length ? (
        <EmptyState
          icon={ToggleLeft}
          title="No feature flags"
          description="Create feature flags to control rollouts and experiments"
          action={{ label: 'Create Flag', onClick: () => {} }}
        />
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <FlagCard key={flag.id} flag={flag} />
          ))}
        </div>
      )}
    </div>
  );
}
