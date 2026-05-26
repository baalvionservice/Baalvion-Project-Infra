import { redirect } from 'next/navigation';

/**
 * Redirects to the current user's profile based on mock app state.
 * In a real app, this would use session data.
 */
export default function CreatorProfileRedirect() {
  // Redirecting to Eleanor Vance (Lead Admin/Creator) by default for the mock
  redirect('/creator/creator-4');
}
