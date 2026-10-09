import { redirect } from 'next/navigation';

// This page showed a hard-coded sample list. Real events listings come from the storefront
// (commerce-service) and are browsed under /shop/events.
export default function MarketplaceEventsRedirect() {
  redirect('/shop/events');
}
