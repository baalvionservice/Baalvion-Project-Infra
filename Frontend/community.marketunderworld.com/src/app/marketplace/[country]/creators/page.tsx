import { redirect } from 'next/navigation';

// Creator investment listings are ordinary marketplace products now: admins post them, and
// identity-verified buyers purchase them through checkout. The old pages here ran on mock data.
export default function InvestmentsMovedToShop() {
  redirect('/shop/investments');
}
