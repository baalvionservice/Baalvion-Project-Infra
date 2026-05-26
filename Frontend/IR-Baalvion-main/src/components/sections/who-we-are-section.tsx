import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function WhoWeAreSection() {
  return (
    <section id="who-we-are" className="w-full bg-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-black">
            Who we are
          </h2>
          <p className="mt-4 text-gray-600 md:text-lg">
            Baalvion is a global investment manager and our purpose is to help more and more people experience financial well-being. As a fiduciary to investors and a leading provider of financial technology, our clients turn to us for the solutions they need when planning for their most important goals.
          </p>
          <div className="mt-8">
            <Button asChild className="bg-black text-white hover:bg-gray-800 rounded-sm px-6 py-3">
              <Link href="#overview">
                Learn more <span className="ml-2">&gt;</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
