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
            Baalvion Industries Private Limited is building the foundational infrastructure for global B2B trade. We bring logistics, trade finance and regulatory compliance together into a single, transparent operating system — helping businesses move goods, capital and documentation across borders with greater speed, trust and efficiency. As a privately held company, we partner with qualified investors who share our long-term conviction in the future of global commerce.
          </p>
          <div className="mt-8">
            <Button asChild className="bg-black text-white hover:bg-gray-800 rounded-sm px-6 py-3">
              <Link href="#overview">
                Explore our strategy <span className="ml-2">&gt;</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
