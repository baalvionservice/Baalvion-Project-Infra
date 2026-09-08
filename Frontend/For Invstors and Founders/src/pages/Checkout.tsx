import { Navigate } from "react-router";

/**
 * RETIRED — superseded by /membership.
 *
 * This page hardcoded its own tier table (`elite-monthly` $2000, `elite-annual` $20000) and
 * posted the amount it had chosen to the checkout call. Pricing asserted by the client is the
 * hole that `startGatewayCheckout` was removed to close: the server now owns the tiers, so
 * `fetchTiers()` reads them and `startMembershipCheckout(tier)` takes only the tier name — there
 * is no amount for a browser to tamper with.
 *
 * Rewiring this page onto the new call would have meant reintroducing a local price list, so the
 * route redirects to the flow that already does it correctly. Kept rather than deleted so the
 * old link keeps working instead of 404ing.
 */
export default function Checkout() {
  return <Navigate to="/membership" replace />;
}
