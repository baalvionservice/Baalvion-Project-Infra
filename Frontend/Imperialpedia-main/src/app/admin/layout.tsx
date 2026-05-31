import { redirect } from 'next/navigation';

// Per-app admin RETIRED. Imperialpedia administration (entities, moderation, media) is
// centralized in the Baalvion admin-platform console → Imperialpedia section.
export default function AdminLayout() {
  redirect(process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL || 'http://localhost:3030/imperialpedia');
}
