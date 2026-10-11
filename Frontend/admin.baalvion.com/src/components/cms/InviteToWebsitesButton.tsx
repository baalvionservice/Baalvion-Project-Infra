'use client';

import { useState, type ComponentProps } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GrantSiteAccessDialog from '@/components/cms/GrantSiteAccessDialog';
import { useWebsites } from '@/lib/queries/cms-websites.queries';

// Invite someone by email and choose exactly which websites they may work on. They see only
// those sites after signing in; everything else stays hidden from them.
export default function InviteToWebsitesButton({
  label = 'Invite',
  ...buttonProps
}: { label?: string } & Omit<ComponentProps<typeof Button>, 'onClick' | 'children'>) {
  const [open, setOpen] = useState(false);
  const { data } = useWebsites({ limit: 100 });

  return (
    <>
      <Button {...buttonProps} onClick={() => setOpen(true)}>
        <UserPlus className="mr-1.5 h-3.5 w-3.5" /> {label}
      </Button>
      <GrantSiteAccessDialog open={open} onOpenChange={setOpen} websites={data?.data ?? []} />
    </>
  );
}
