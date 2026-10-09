import { redirect } from 'next/navigation';

// The per-country hub was driven by a hard-coded module registry. The real department and
// category browser is /shop.
export default function CountryHubRedirect() {
  redirect('/shop');
}
