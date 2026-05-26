import type { Metadata } from 'next';
import Link from 'next/link';
import { pressReleases } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Share2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export const metadata: Metadata = {
  title: 'Press Releases | Official News',
  description: 'The latest official announcements, corporate news, and regulatory filings from Baalvion.',
};

export default function PressReleasesPage() {
  return (
    <div className="animate-in fade-in duration-700">
      <section className="bg-black text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-bold text-primary tracking-[0.2em] mb-4 uppercase">News & Events</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">Press Releases</h1>
        </div>
      </section>

      <section className="py-16 bg-white text-black">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-12 pb-8 border-b border-gray-100">
            <div className="flex gap-4 items-center">
              <span className="text-xs font-bold uppercase text-gray-400">Filter By Year:</span>
              <Select defaultValue="2026">
                <SelectTrigger className="w-[120px] rounded-none border-gray-300 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search releases..." className="pl-10 text-white rounded-none border-gray-300" />
            </div>
          </div>

          <div className="space-y-16">
            {pressReleases.map((release, idx) => (
              <article key={idx} className="group">
                <div className="flex items-start gap-8">
                  <div className="hidden md:flex flex-col items-center pt-1 text-gray-300">
                    <span className="text-2xl font-bold leading-none">{release.date.split(' ')[1].replace(',', '')}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{release.date.split(' ')[0]}</span>
                  </div>
                  <div className="flex-1 space-y-4">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">{release.date} — New York</p>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight group-hover:text-primary transition-colors cursor-pointer">
                      <Link href={release.link}>{release.title}</Link>
                    </h2>
                    <div className="flex items-center gap-6 pt-4">
                      {release.download && (
                        <Link href={release.download} className="flex items-center gap-2 text-xs font-bold hover:text-primary transition-colors">
                          <Download className="h-4 w-4" /> Full Release (PDF)
                        </Link>
                      )}
                      {release.webcast && (
                        <Link href={release.webcast} className="flex items-center gap-2 text-xs font-bold hover:text-primary transition-colors">
                          <FileText className="h-4 w-4" /> Webcast Summary
                        </Link>
                      )}
                      <button className="ml-auto p-2 text-gray-300  hover:text-black transition-colors">
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-20 flex justify-center">
            <Button variant="outline" className="rounded-none border-2 text-white border-black px-12 h-14 font-bold text-sm hover:bg-black hover:text-white transition-all">
              Load Previous Releases
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-6">Media Inquiries</h3>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">Journalists and media representatives can contact our corporate communications team for press materials and executive interviews.</p>
          <Button className="rounded-none px-8 py-6 font-bold" asChild>
            <Link href="/resources/contact-ir">Contact Media Relations &gt;</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
