'use client';

import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import WebsiteCard from '@/components/cms/WebsiteCard';
import CreateWebsiteModal from '@/components/cms/CreateWebsiteModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useWebsites, useDeleteWebsite } from '@/lib/queries/cms-websites.queries';
import { useCmsStore } from '@/lib/store/cmsStore';
import { useUIStore } from '@/lib/store/uiStore';

export default function WebsitesPage() {
  const { setBreadcrumbs } = useUIStore();
  const setActiveWebsite = useCmsStore((s) => s.setActiveWebsite);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useWebsites({
    search: search || undefined,
    status: statusFilter || undefined,
  });
  const { mutate: deleteWebsite } = useDeleteWebsite();

  useEffect(() => {
    setBreadcrumbs([{ label: 'CMS', href: '/cms' }, { label: 'Websites' }]);
  }, [setBreadcrumbs]);

  const websites = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Websites"
        description={`${data?.pagination.total ?? 0} managed websites`}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Website
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="h-9 pl-8 text-sm"
            placeholder="Search websites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : websites.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border py-20 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            {search || statusFilter ? 'No websites match your filters.' : 'No websites yet.'}
          </p>
          {!search && !statusFilter && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first website
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {websites.map((w) => (
            <WebsiteCard
              key={w.id}
              website={w}
              onSelect={setActiveWebsite}
              onDelete={(id) => deleteWebsite(id)}
            />
          ))}
        </div>
      )}

      <CreateWebsiteModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
