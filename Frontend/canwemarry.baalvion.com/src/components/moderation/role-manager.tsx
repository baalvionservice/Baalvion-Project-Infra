'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Modal, Select, useToast } from '@/components/ui';
import { admin } from '@/lib/api';
import { useIdentity } from '@/lib/auth/identity-context';
import type { AdminUser } from '@/lib/api/types';
import '@/lib/auth/session';

/**
 * Granting and revoking standing.
 *
 * A moderator sees only SUPPORTER and VOLUNTEER in this list, because those are the only
 * two the service will let them confer — `userService.grantRole` refuses anything higher
 * from a non-admin, so the moderation tier cannot enlarge itself. The narrowed dropdown
 * matches that rule rather than replacing it; a moderator who posts ADMIN by hand still
 * gets a 403.
 */
const ALL_ROLES = [
  { value: 'SUPPORTER', label: 'Supporter — can offer support on cases' },
  { value: 'VOLUNTEER', label: 'Volunteer — curates resources, can create communities' },
  { value: 'MODERATOR', label: 'Moderator — reviews reports and moderates content' },
  { value: 'ADMIN', label: 'Administrator — full platform access' },
];

const MODERATOR_GRANTABLE = ['SUPPORTER', 'VOLUNTEER'];

export function RoleManager({ user }: { user: AdminUser }) {
  const router = useRouter();
  const toast = useToast();
  const { hasRole } = useIdentity();
  // Unique per instance: this component renders once per row of the user table, and a
  // fixed id meant every select after the first had no label bound to it at all.
  const selectId = useId();

  const [open, setOpen] = useState(false);
  const [role, setRole] = useState('');
  const [busy, setBusy] = useState(false);

  const isAdmin = hasRole('ADMIN');
  const options = isAdmin ? ALL_ROLES : ALL_ROLES.filter((r) => MODERATOR_GRANTABLE.includes(r.value));

  async function grant() {
    setBusy(true);
    const result = await admin.grantRole(user.id, role);
    setBusy(false);
    if (!result.ok) { toast.error(result.error.message); return; }
    toast.success(`${role.toLowerCase()} granted.`);
    setOpen(false); setRole('');
    router.refresh();
  }

  async function revoke(target: string) {
    const result = await admin.revokeRole(user.id, target);
    if (!result.ok) { toast.error(result.error.message); return; }
    toast.success(`${target.toLowerCase()} revoked.`);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {user.roles.map((r) => {
          const removable = r !== 'USER' && (isAdmin || MODERATOR_GRANTABLE.includes(r));
          return (
            <span key={r} className="inline-flex items-center gap-1">
              <Badge tone={r === 'ADMIN' || r === 'MODERATOR' ? 'accent' : 'neutral'}>{r.toLowerCase()}</Badge>
              {removable && (
                <button type="button" onClick={() => void revoke(r)}
                  className="focus-ring rounded px-0.5 text-xs text-muted-2 hover:text-danger"
                  title={`Revoke ${r.toLowerCase()}`}>
                  <span className="sr-only">Revoke {r.toLowerCase()} from this account</span>
                  <span aria-hidden="true">×</span>
                </button>
              )}
            </span>
          );
        })}
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>Grant</Button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Grant standing"
        description={isAdmin
          ? 'Administrators can confer any role.'
          : 'Moderators can confer supporter and volunteer standing. Appointing a moderator or administrator is an administrator’s decision.'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={() => void grant()} loading={busy} disabled={busy || !role}>{busy ? 'Granting…' : 'Grant'}</Button>
          </>
        }
      >
        <label htmlFor={selectId} className="mb-2 block text-sm font-medium">Role</label>
        <Select id={selectId} options={options} placeholder="Choose a role" value={role}
          onChange={(e) => setRole(e.target.value)} />
      </Modal>
    </>
  );
}
