import { redirect } from 'next/navigation';

// This page showed placeholder figures with no backing system. Real paid access lives at /access.
export default function RetiredPage() {
  redirect('/access');
}
