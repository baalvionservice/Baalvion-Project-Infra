'use client';

import { useEffect } from 'react';
import { ListTodo, Globe2, Clock } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';
import { PENDING_FEATURES, type PendingFeatureStatus } from '@/lib/constants/pending-features';

const STATUS_LABEL: Record<PendingFeatureStatus, string> = {
  planned: 'Planned',
  scoped: 'Scoped',
  'in-progress': 'In progress',
};

const STATUS_CLASS: Record<PendingFeatureStatus, string> = {
  planned: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400',
  scoped: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  'in-progress': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
};

export default function PendingFeaturesPage() {
  const { setBreadcrumbs } = useUIStore();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Pending Features' }]);
  }, [setBreadcrumbs]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pending Features"
        description="Work that's been discussed and scoped, but not built yet — the actual queue, not a wishlist."
      />

      {PENDING_FEATURES.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="Nothing pending"
          description="Nothing is queued right now."
        />
      ) : (
        <div className="space-y-3">
          {PENDING_FEATURES.map((f) => (
            <Card key={f.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{f.title}</p>
                      <Badge variant="outline" className={`text-xs capitalize ${STATUS_CLASS[f.status]}`}>
                        {STATUS_LABEL[f.status]}
                      </Badge>
                    </div>
                    <p className="mb-2 text-xs text-muted-foreground">{f.description}</p>
                    {f.notes && (
                      <p className="mb-2 text-xs italic text-muted-foreground">{f.notes}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Globe2 className="h-3 w-3" />
                        {f.sites.join(', ')}
                      </span>
                      {f.estimate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {f.estimate}
                        </span>
                      )}
                      <span>Added {formatDate(f.addedDate)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
