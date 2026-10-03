import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'The Market Underworld Community is an online community and marketplace operated by Baalvion Industries Private Limited.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0B0C0F] text-white">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#39FF14]">About</p>
        <h1 className="mt-3 text-4xl font-bold uppercase tracking-tight font-display">About the Community</h1>
        <div className="mt-10 space-y-5 text-sm text-[#9CA3AF] leading-relaxed">
          <p>
            The Market Underworld Community is an online community and marketplace. Members take part in forums, join classes and live sessions, and buy goods from independent sellers.
          </p>
          <p>
            It is operated by Baalvion Industries Private Limited (CIN U43121OD2025PTC048479), a private limited company incorporated in India on 11 March 2025. Registered office: C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha 764036, India. Operating office: Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India.
          </p>
          <p>
            Contact: support@baalvion.com, +91 89512 84770. Our policies are linked in the footer of every page.
          </p>
        </div>
      </div>
    </main>
  );
}
