import Link from 'next/link';
import { Card, CardBody, CardTitle } from '@/components/ui';
import type { CaseDetail } from '@/lib/api/types';

/**
 * What the owner's own settings currently mean, in plain words.
 *
 * A person deciding how much of their family situation to expose should not have to infer
 * the rules from a badge. Each line below describes the case AS IT IS CONFIGURED RIGHT NOW
 * rather than describing the feature in general — "nobody but you" reads very differently
 * from "anyone with the link", and the difference is the whole decision.
 *
 * Shown to the owner only. It is a description of their own settings, and nobody else's
 * business.
 */

const WHO_CAN_SEE: Record<string, string> = {
  PRIVATE: 'Only you and the people you have invited and who accepted.',
  COMMUNITY: 'You, the people taking part, and members of the community this case is in.',
  PUBLIC: 'Anyone who visits CanWeMarry, including people who are not signed in.',
};

const STATUS_MEANING: Record<string, string> = {
  DRAFT: 'This is a draft. Nobody but you can see it, and it appears in no listing.',
  OPEN: 'This case is open, so people who can see it may offer support and comment.',
  ON_HOLD: 'You have paused this case. It stays visible, and you can reopen it whenever you want.',
  RESOLVED: 'You have marked this resolved. It stays readable, and nothing new is expected.',
  CLOSED: 'This case is closed.',
};

export function OwnerGuide({ case: c }: { case: CaseDetail }) {
  return (
    <Card>
      <CardBody>
        <CardTitle className="text-base">What this case shows, and to whom</CardTitle>

        <dl className="mt-4 space-y-4 text-sm leading-relaxed">
          <div>
            <dt className="font-medium">Who can see it</dt>
            <dd className="mt-1 text-muted">{WHO_CAN_SEE[c.visibility]}</dd>
          </div>

          <div>
            <dt className="font-medium">Where it stands</dt>
            <dd className="mt-1 text-muted">{STATUS_MEANING[c.status]}</dd>
          </div>

          <div>
            <dt className="font-medium">What support means</dt>
            <dd className="mt-1 text-muted">
              Someone offering support is saying they will listen. It is not a vote, it carries
              no authority, and it changes nothing about your situation on its own. You decide
              who to accept, and you can withdraw that at any time.
            </dd>
          </div>

          <div>
            <dt className="font-medium">What inviting someone does</dt>
            <dd className="mt-1 text-muted">
              An invitation is a link you share yourself, with whoever you choose. It names
              only how that person relates to you — never their address or details. They see
              nothing about the case until they accept, and they are free to decline.
            </dd>
          </div>

          <div>
            <dt className="font-medium">Changing your mind</dt>
            <dd className="mt-1 text-muted">
              You can narrow who can see this, pause it, or close it from{' '}
              <Link href={`/cases/${c.id}/edit`} className="focus-ring rounded-sm font-medium text-accent-strong underline underline-offset-2">
                edit this case
              </Link>
              . Narrowing takes effect immediately, though anything already read cannot be
              unread.
            </dd>
          </div>
        </dl>
      </CardBody>
    </Card>
  );
}
