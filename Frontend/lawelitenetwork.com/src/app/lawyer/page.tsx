import { redirect } from 'next/navigation';

// `/lawyer` has no standalone page (profiles live at `/lawyer/[id]`). Redirect any hit
// (including stray prefetches) to the practitioner dashboard instead of 404-ing.
export default function LawyerIndex() {
  redirect('/lawyer/dashboard');
}
