import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { TrendingUp, Target, Zap } from "lucide-react";

export default function ThesisSection({ id }: { id: string }) {
  const chart1 = PlaceHolderImages.find((p) => p.id === "thesis-chart-1");
  const chart2 = PlaceHolderImages.find((p) => p.id === "thesis-chart-2");

  return (
    <section id={id} className="w-full bg-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black">
            Investment Thesis
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Our strategy is centered on creating a durable competitive moat by integrating critical infrastructure for global B2B trade.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="bg-transparent border-0 shadow-none">
            <CardHeader className="items-start">
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-black">Capture High-Growth Corridors</CardTitle>
            </CardHeader>
            <CardContent className="text-start">
              <p className="text-gray-600 text-left">We target trade routes and digital ecosystems experiencing exponential growth, focusing on emerging markets and technology-driven supply chains where our integrated system can provide maximum value.</p>
            </CardContent>
          </Card>
          <Card className="bg-transparent border-0 shadow-none">
            <CardHeader className="items-start">
              <Target className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-black">Acquire Strategic Technology</CardTitle>
            </CardHeader>
            <CardContent className="text-start">
              <p className="text-gray-600  text-left">Our M&A strategy focuses on acquiring key technologies in trade finance, compliance automation (AML/KYC), and logistics management to accelerate our platform's capabilities and market penetration.</p>
            </CardContent>
          </Card>
          <Card className="bg-transparent border-0 shadow-none">
            <CardHeader className="items-start">
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-black">Build a Network Effect</CardTitle>
            </CardHeader>
            <CardContent className="text-start">
              <p className="text-gray-600  text-left">By integrating essential services, we create a powerful network effect. Each new partner, customer, and transaction on our platform increases its value for all other participants, creating a self-reinforcing cycle of growth.</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-gray-50 border-neutral-200">
            <CardHeader>
              <CardTitle className="text-black mb-2">Market Opportunity Analysis</CardTitle>
              <CardDescription className="text-gray-500">Projected growth in our target addressable markets (TAM).</CardDescription>
            </CardHeader>
            <CardContent>
              {chart1 && (
                <Image
                  src={chart1.imageUrl}
                  alt="Market Opportunity Chart"
                  data-ai-hint={chart1.imageHint}
                  width={600}
                  height={400}
                  className="rounded-lg object-cover"
                />
              )}
            </CardContent>
          </Card>
          <Card className="bg-gray-50 border-neutral-200">
            <CardHeader>
              <CardTitle className="text-black mb-2">Capital Allocation Strategy</CardTitle>
              <CardDescription className="text-gray-500">Our disciplined approach to deploying capital for maximum ROI.</CardDescription>
            </CardHeader>
            <CardContent>
              {chart2 && (
                <Image
                  src={chart2.imageUrl}
                  alt="Capital Allocation Chart"
                  data-ai-hint={chart2.imageHint}
                  width={600}
                  height={400}
                  className="rounded-lg object-cover"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
