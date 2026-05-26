import { Button } from "@/components/ui/button";
import { pressReleases } from "@/lib/data";
import Link from "next/link";

export default function PressReleasesSection({ id }: { id: string }) {
  return (
    <section id={id} className="w-full bg-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black">
            Recent Press Releases
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Stay informed with the latest official announcements, financial reporting, and strategic milestones from Baalvion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pressReleases.map((release, index) => (
            <div key={index} className="border border-gray-200 p-8 flex flex-col h-full bg-white text-black transition-transform duration-300 ease-in-out hover:-translate-y-2">
              <h3 className="font-bold text-xl flex-grow">{release.title}</h3>
              <div className="mt-8">
                <p className="text-sm text-gray-600 mb-6">{release.date}</p>
                <Link href={release.link} className="text-sm font-bold text-primary hover:underline flex items-center">
                  Read full release <span className="ml-2">&gt;</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 flex justify-center">
          <Button size="lg" asChild className="bg-black text-white hover:bg-gray-800 rounded-none px-8 py-6">
            <Link href="#">
              All releases <span className="ml-2">&gt;</span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
