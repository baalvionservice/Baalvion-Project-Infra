'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Globe, Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWebsite, useUpdateWebsite } from '@/lib/queries/cms-websites.queries';
import { useUIStore } from '@/lib/store/uiStore';

export default function WebsiteSeoPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const { setBreadcrumbs } = useUIStore();

  const { data: website, isLoading } = useWebsite(websiteId);
  const { mutate: update, isPending } = useUpdateWebsite(websiteId);

  const [titleSuffix, setTitleSuffix] = useState('');
  const [defaultDesc, setDefaultDesc] = useState('');
  const [defaultOgImage, setDefaultOgImage] = useState('');
  const [redirects, setRedirects] = useState<Array<{ from: string; to: string; code: number }>>([]);

  useEffect(() => {
    if (website) {
      setTitleSuffix(website.config?.seoDefaults?.titleSuffix ?? '');
      setDefaultDesc(website.config?.seoDefaults?.defaultMetaDescription ?? '');
      setDefaultOgImage(website.config?.seoDefaults?.defaultOgImage ?? '');
      setBreadcrumbs([
        { label: 'CMS', href: '/cms' },
        { label: website.name, href: `/cms/websites/${websiteId}` },
        { label: 'SEO' },
      ]);
    }
  }, [website, setBreadcrumbs, websiteId]);

  const handleSaveDefaults = () => {
    update({
      config: {
        ...website?.config,
        seoDefaults: {
          titleSuffix: titleSuffix || undefined,
          defaultMetaDescription: defaultDesc || undefined,
          defaultOgImage: defaultOgImage || undefined,
        },
      },
    });
  };

  const addRedirect = () =>
    setRedirects((prev) => [...prev, { from: '', to: '', code: 301 }]);

  const updateRedirect = (
    idx: number,
    field: 'from' | 'to' | 'code',
    value: string | number
  ) =>
    setRedirects((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );

  const removeRedirect = (idx: number) =>
    setRedirects((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href={`/cms/websites/${websiteId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {website?.name ?? 'Website'}
          </Link>
        </Button>
        <PageHeader
          title="SEO Settings"
          description="Global SEO defaults, redirects, and sitemap configuration"
        />
      </div>

      <Tabs defaultValue="defaults">
        <TabsList>
          <TabsTrigger value="defaults">Defaults</TabsTrigger>
          <TabsTrigger value="redirects">Redirects</TabsTrigger>
          <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
        </TabsList>

        <TabsContent value="defaults" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Global SEO Defaults</CardTitle>
              <CardDescription className="text-xs">
                These values are used as fallbacks when individual content lacks SEO settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Title Suffix</Label>
                <Input
                  className="h-8 text-xs max-w-sm"
                  placeholder="| Site Name"
                  value={titleSuffix}
                  onChange={(e) => setTitleSuffix(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Appended to every page title. Example: &quot;Page Title | Your Brand&quot;
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Default Meta Description</Label>
                <textarea
                  className="w-full resize-none rounded-md border bg-background px-3 py-2 text-xs min-h-[70px] focus:outline-none focus:ring-2 focus:ring-ring max-w-lg"
                  placeholder="Default meta description for pages without their own..."
                  value={defaultDesc}
                  onChange={(e) => setDefaultDesc(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Default OG Image URL</Label>
                <Input
                  className="h-8 text-xs max-w-lg"
                  placeholder="https://... (1200×630)"
                  value={defaultOgImage}
                  onChange={(e) => setDefaultOgImage(e.target.value)}
                />
              </div>

              <Button size="sm" onClick={handleSaveDefaults} disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Defaults'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redirects" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm">URL Redirects</CardTitle>
                <CardDescription className="text-xs">
                  Manage 301/302 redirects for this website.
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={addRedirect}>
                <Plus className="mr-2 h-4 w-4" />
                Add Redirect
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {redirects.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No redirects configured.
                </p>
              ) : (
                redirects.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      className="h-8 text-xs"
                      placeholder="/old-path"
                      value={r.from}
                      onChange={(e) => updateRedirect(i, 'from', e.target.value)}
                    />
                    <span className="text-xs text-muted-foreground shrink-0">→</span>
                    <Input
                      className="h-8 text-xs flex-1"
                      placeholder="/new-path"
                      value={r.to}
                      onChange={(e) => updateRedirect(i, 'to', e.target.value)}
                    />
                    <select
                      className="h-8 rounded-md border bg-background px-2 text-xs"
                      value={r.code}
                      onChange={(e) => updateRedirect(i, 'code', Number(e.target.value))}
                    >
                      <option value={301}>301</option>
                      <option value={302}>302</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive shrink-0"
                      onClick={() => removeRedirect(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
              {redirects.length > 0 && (
                <Button size="sm" className="mt-2">
                  Save Redirects
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sitemap" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sitemap</CardTitle>
              <CardDescription className="text-xs">
                Auto-generated sitemap at{' '}
                <code className="bg-muted px-1 rounded text-xs">
                  https://{website?.domain ?? 'yoursite.com'}/sitemap.xml
                </code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Include Pages</p>
                  <p className="text-xs text-muted-foreground">Include CMS pages in sitemap</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Include Posts</p>
                  <p className="text-xs text-muted-foreground">Include blog posts in sitemap</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Submit to Google</p>
                  <p className="text-xs text-muted-foreground">Auto-ping Google Search Console</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
