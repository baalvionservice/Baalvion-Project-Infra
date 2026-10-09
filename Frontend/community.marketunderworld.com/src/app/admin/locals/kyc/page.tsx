import { redirect } from 'next/navigation';

// KYC review now lives in one place for the whole site.
export default function KycReviewMoved() {
  redirect('/admin/kyc');
}
