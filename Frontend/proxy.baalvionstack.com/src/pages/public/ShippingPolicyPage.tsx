import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen py-20">
      <SEOHead title="Service Delivery Policy" description="How access to Baalvion NetStack proxy plans is delivered. Nothing is shipped physically." />
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              Legal
            </Badge>
            <h1 className="text-4xl font-bold mb-4">Service Delivery Policy</h1>
            <p className="text-muted-foreground">Last updated: October 4, 2026</p>
          </div>

          <Card className="bg-card/50">
            <CardContent className="p-8 md:p-12 max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">1. Digital service</h2>
                <p className="text-muted-foreground mb-4">Baalvion NetStack is an online proxy-network service. No physical goods are sold or shipped, so no shipping charges apply.</p>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">2. When access starts</h2>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Once payment is confirmed, your plan and bandwidth are credited to your account, normally within a few minutes.</li>
                  <li>Proxy credentials, endpoints and API keys appear in the dashboard under Proxy Access and API Keys.</li>
                  <li>Enterprise plans are provisioned after the order form is signed; the date is agreed in writing.</li>
                </ul>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">3. If your plan is not activated</h2>
                <p className="text-muted-foreground mb-4">If you have paid and the plan is not active after 30 minutes, email support@baalvion.com with the transaction ID. We will activate it or refund you.</p>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">4. Identity checks</h2>
                <p className="text-muted-foreground mb-4">We may ask for identity or business verification before activating certain plans, in line with our Acceptable Use Policy. Delivery pauses until verification is complete; we refund the payment if we cannot verify you.</p>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">5. Availability</h2>
                <p className="text-muted-foreground mb-4">The service is available worldwide except where law or sanctions prevent us from serving a person or territory. Network targets and availability are described on the Status and SLA pages.</p>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Operator</h2>
                <p className="text-muted-foreground mb-4">Baalvion Industries Private Limited, CIN U43121OD2025PTC048479. Registered office: C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha 764036, India. Operating office: Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India. Phone +91 89512 84770. Email support@baalvion.com.</p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
