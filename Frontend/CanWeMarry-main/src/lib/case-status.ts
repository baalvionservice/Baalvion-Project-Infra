import type { CaseStatus, ModerationState } from './api/types';

/**
 * How each case state is described to a person.
 *
 * Only the states the backend actually stores appear here. In particular there is no
 * "Supported" state: the schema has no such thing, and inventing one would let the UI
 * imply an outcome the data does not record. `RESOLVED` means the author marked it
 * resolved — it does not mean the platform achieved anything.
 */
export const CASE_STATUS: Record<CaseStatus, { label: string; tone: 'neutral' | 'accent' | 'ok' | 'warn'; blurb: string }> = {
  DRAFT: {
    label: 'Draft',
    tone: 'neutral',
    blurb: 'Visible to nobody but you. Nothing is shared until you open it.',
  },
  OPEN: {
    label: 'Open',
    tone: 'accent',
    blurb: 'Accepting support and discussion from the people who can see it.',
  },
  ON_HOLD: {
    label: 'On hold',
    tone: 'warn',
    blurb: 'Paused by its author. Still visible to the people already in it.',
  },
  RESOLVED: {
    label: 'Resolved',
    tone: 'ok',
    blurb: 'The author marked their situation as moved on. It says nothing about how.',
  },
  CLOSED: {
    label: 'Closed',
    tone: 'neutral',
    blurb: 'No longer active. Its author closed it.',
  },
};

/**
 * Moderation state, shown only when it is not the ordinary one. UNDER_REVIEW is deliberately
 * visible rather than hidden — somebody reading a flagged case should know it is being
 * looked at, and a report never hides anything on its own.
 */
export const MODERATION_STATE: Partial<Record<ModerationState, { label: string; tone: 'warn' | 'danger'; blurb: string }>> = {
  UNDER_REVIEW: {
    label: 'Under review',
    tone: 'warn',
    blurb: 'Reported, and a moderator is looking at it. It stays visible while they do — a report is not a way to hide something.',
  },
  HIDDEN: {
    label: 'Withheld',
    tone: 'danger',
    blurb: 'A moderator has withheld this from everyone but its author.',
  },
  REMOVED: {
    label: 'Removed',
    tone: 'danger',
    blurb: 'A moderator has removed this.',
  },
};

export const SUPPORT_NEED: Record<string, string> = {
  LISTENING: 'Someone to listen',
  MEDIATION: 'Mediation',
  LEGAL: 'Legal information',
  COUNSELLING: 'Counselling',
  COMMUNITY: 'Community support',
  PRACTICAL: 'Practical help',
  OTHER: 'Other',
};
