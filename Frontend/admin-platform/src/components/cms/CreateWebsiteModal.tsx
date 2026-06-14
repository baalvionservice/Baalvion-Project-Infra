'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCreateWebsite } from '@/lib/queries/cms-websites.queries';
import type { WebsiteModule } from '@/lib/types/cms-website.types';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug: lowercase letters, numbers, hyphens only'),
  domain: z.string().min(3, 'Enter a valid domain'),
});

type FormValues = z.infer<typeof schema>;

const ALL_MODULES: WebsiteModule[] = ['blog', 'pages', 'products', 'jobs', 'events', 'portfolio', 'news', 'docs'];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateWebsiteModal({ open, onClose }: Props) {
  const [selectedModules, setSelectedModules] = useState<WebsiteModule[]>(['pages', 'blog']);
  const { mutate: create, isPending } = useCreateWebsite();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const toggleModule = (m: WebsiteModule) => {
    setSelectedModules((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const onSubmit = (values: FormValues) => {
    create(
      { ...values, modules: selectedModules },
      {
        onSuccess: () => {
          reset();
          setSelectedModules(['pages', 'blog']);
          onClose();
        },
      }
    );
  };

  const name = watch('name');
  const autoSlug = (val: string) => val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Create New Website
          </DialogTitle>
          <DialogDescription>
            Configure a new managed website. You can adjust settings later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Website Name</Label>
            <Input
              id="name"
              placeholder="My Company Blog"
              {...register('name', {
                onChange: (e) => setValue('slug', autoSlug(e.target.value)),
              })}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" placeholder="my-company-blog" {...register('slug')} />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input id="domain" placeholder="blog.baalvion.com" {...register('domain')} />
            {errors.domain && <p className="text-xs text-destructive">{errors.domain.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Modules</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_MODULES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleModule(m)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                    selectedModules.includes(m)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background hover:bg-muted'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Website'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
