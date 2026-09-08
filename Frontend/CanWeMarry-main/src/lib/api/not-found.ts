import { notFound } from 'next/navigation';
import type { ApiError } from './client';

/**
 * Turn an API failure into a 404 — but ONLY when the API actually said 404.
 *
 * The distinction matters more than it looks. `if (!result.ok) notFound()` reads as "we could
 * not get it, so it does not exist", and those are different statements: a backend that is
 * down, a gateway that refused, a request that timed out and a resource that genuinely is not
 * there all arrive as `!ok`. Collapsing them told visitors that a case had been deleted when
 * the truth was that a service had stopped — and it hid outages from monitoring behind a
 * status that looks like ordinary traffic.
 *
 * Measured: with canwemarry-service stopped, `/community/<a real slug>` answered 404.
 *
 * A 404 from this API already covers "not permitted": the service deliberately returns 404
 * rather than 403 for a private case, so that a refusal cannot confirm the thing exists. So
 * this helper needs no separate authorization branch — the privacy decision was made
 * server-side and is carried in the status.
 *
 * Anything else is returned to the caller, which should render an error state rather than
 * claim the resource is missing.
 */
export function notFoundIfMissing(error: ApiError): ApiError {
  if (error.status === 404) notFound();
  return error;
}
