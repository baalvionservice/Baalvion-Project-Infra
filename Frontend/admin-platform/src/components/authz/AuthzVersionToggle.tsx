'use client';

import { FlaskConical, ShieldCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAuthzVersion, setAuthzVersion } from '@/lib/authz/version';

/**
 * Switches the console between the new access-control layer and the original behaviour.
 *
 * Kept where a person actually is when something looks wrong (the user menu) rather than
 * buried in settings, so comparing the two is one click. The choice is per-browser and does
 * not change anyone else's console — and it never changes what the BACKEND allows, so
 * switching to the old view cannot grant access the server would refuse.
 */
export default function AuthzVersionToggle() {
  const version = useAuthzVersion();
  const isNew = version === 'new';

  return (
    <div className="px-2 py-1.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {isNew ? (
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
          ) : (
            <FlaskConical className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
          )}
          <span className="truncate text-xs font-medium">
            {isNew ? 'New access control' : 'Original version'}
          </span>
        </div>
        <Switch
          checked={isNew}
          onCheckedChange={(v) => setAuthzVersion(v ? 'new' : 'old')}
          aria-label="Use the new access-control layer"
        />
      </div>
      <p className="mt-1 pl-5 text-[11px] leading-snug text-muted-foreground">
        {isNew
          ? 'Sections you can’t use are hidden and blocked.'
          : 'Menu-only filtering, as before. Server permissions are unchanged.'}
      </p>
    </div>
  );
}
