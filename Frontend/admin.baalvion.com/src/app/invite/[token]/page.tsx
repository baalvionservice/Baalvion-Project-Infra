import { use } from 'react';
import InvitationExperience from '@/components/invite/InvitationExperience';

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  return <InvitationExperience token={token} />;
}
