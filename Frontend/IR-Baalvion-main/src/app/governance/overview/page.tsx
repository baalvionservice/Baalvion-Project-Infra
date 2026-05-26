import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ShieldCheck, Scale, Gavel, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Governance Overview | Corporate Governance',
  description: 'Baalvion’s corporate governance framework supports sustainable financial performance and long-term value creation.',
};

const documents = [
  {
    group: "Policies & Standards", items: [
      { title: 'Categorical Standards of Director Independence', icon: UserCheck },
      { title: 'Code of Business Conduct and Ethics', icon: ShieldCheck },
      { title: 'Code of Ethics for Chief Executive and Senior Financial Officers', icon: ShieldCheck },
      { title: 'Corporate Governance Guidelines', icon: Scale },
      { title: 'Lead Independent Director Guidelines', icon: Gavel },
    ]
  },
  {
    group: "Committee Charters", items: [
      { title: 'Audit Committee Charter', icon: FileText },
      { title: 'Management Development & Compensation Committee Charter', icon: FileText },
      { title: 'Executive Committee Charter', icon: FileText },
      { title: 'Nominating and Governance Committee Charter', icon: FileText },
      { title: 'Risk Committee Charter', icon: FileText },
    ]
  },
  {
    group: "Organizational Documents", items: [
      { title: 'Amended and Restated Bylaws', icon: Scale },
      { title: 'Restated Certificate of Incorporation', icon: Scale },
    ]
  }
];

export default function GovernanceOverviewPage() {
  return (
    <div className="animate-in fade-in duration-700">
      <section className="bg-black text-white py-16 md:py-24 border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <p className="text-sm font-bold text-primary tracking-[0.2em] mb-4 uppercase">Governance</p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">Governance Overview</h1>
            <p className="mt-6 text-lg text-gray-400 leading-relaxed max-w-2xl">
              Our commitment to effective leadership and transparent oversight is the cornerstone of our fiduciary responsibility to shareholders.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white text-black">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2 space-y-12">
              <div className="prose prose-lg max-w-none">
                <h2 className="text-3xl font-bold mb-6">Corporate Framework</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Baalvion's corporate governance framework is a set of principles, guidelines and practices that support sustainable financial performance and value creation for our shareholders over the long-term. Our commitment to good corporate governance is integral to our business and reflects not only regulatory requirements, but effective leadership and oversight by our senior management team and Board of Directors.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  We regularly conduct calls with our shareholders to solicit feedback on our corporate governance framework. We make an effort to incorporate this feedback through enhanced policies, processes and disclosure.
                </p>
              </div>

              <div className="space-y-16">
                {documents.map((group) => (
                  <div key={group.group}>
                    <h3 className="text-xl font-bold mb-6 border-b border-gray-200 pb-4">{group.group}</h3>
                    <div className="grid gap-4">
                      {group.items.map((doc) => (
                        <Link
                          key={doc.title}
                          href="#"
                          className="flex items-center justify-between p-6 bg-gray-50 border border-transparent hover:border-primary/20 hover:bg-gray-100 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <doc.icon className="h-5 w-5 text-primary" />
                            <span className="font-bold text-sm tracking-tight">{doc.title}</span>
                          </div>
                          <FileText className="h-5 w-5 text-gray-300 group-hover:text-primary transition-colors" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="space-y-8">
              <Card className="bg-gray-50 border-none shadow-none rounded-none">
                <CardHeader>
                  <CardTitle className="text-lg">Contact the Board</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p className="text-gray-600">Correspondence may be sent to the Board of Directors c/o Corporate Communications:</p>
                  <div className="font-bold">
                    Baalvion, Inc.<br />
                    Semiliguda, Koraput<br />
                    Koraput, Orissa
                  </div>
                  <p className="text-primary font-bold hover:underline cursor-pointer">Email: board@baalvion.com</p>
                </CardContent>
              </Card>

              <Card className="bg-black text-white border-none rounded-none">
                <CardHeader>
                  <CardTitle className="text-lg">Business Integrity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p className="text-gray-400">Reports of potential illegal or unethical conduct may be made via our secure integrity hotline.</p>
                  <Link href="#" className="inline-block text-primary font-bold hover:underline">
                    Access Integrity Portal &gt;
                  </Link>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
