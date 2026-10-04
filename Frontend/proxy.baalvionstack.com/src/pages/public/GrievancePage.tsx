import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";

export default function GrievancePage() {
  return (
    <div className="min-h-screen py-20">
      <SEOHead title="Grievance Redressal" description="How to raise a complaint about Baalvion NetStack, who receives it, and how quickly it is answered." />
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              Legal
            </Badge>
            <h1 className="text-4xl font-bold mb-4">Grievance Redressal</h1>
            <p className="text-muted-foreground">Last updated: October 4, 2026</p>
          </div>

          <Card className="bg-card/50">
            <CardContent className="p-8 md:p-12 max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">1. Who we are</h2>
                <p className="text-muted-foreground mb-4">Baalvion NetStack is operated by Baalvion Industries Private Limited (CIN U43121OD2025PTC048479), a company incorporated in India. This page sets out our grievance redressal mechanism in line with the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.</p>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">2. Grievance Officer</h2>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Designation: Grievance Officer, Baalvion Industries Private Limited</li>
                  <li>Email: legal@baalvion.com</li>
                  <li>Phone: +91 89512 84770</li>
                  <li>Post: Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India</li>
                </ul>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">3. How to file a complaint</h2>
                <p className="text-muted-foreground mb-4">Email the Grievance Officer with the details below. A complaint that arrives with these details can be investigated straight away; one that does not will cost you a round-trip of questions.</p>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Your name and the email address registered on your account</li>
                  <li>Order, invoice or payment reference (for payment issues, the gateway transaction ID)</li>
                  <li>A description of the problem and what outcome you are asking for</li>
                  <li>Screenshots or documents that support the complaint, if you have them</li>
                </ul>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">4. What happens next</h2>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>We acknowledge every complaint within 48 hours of receiving it and give you a reference number.</li>
                  <li>We aim to resolve it, or tell you plainly why we cannot, within 30 days of receipt.</li>
                  <li>Payment and refund complaints are prioritised. A confirmed double charge or a failed-payment debit is reversed to the original payment method.</li>
                </ul>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">5. If you are not satisfied</h2>
                <p className="text-muted-foreground mb-4">If the outcome does not resolve your complaint, reply to the same thread and ask for escalation to a director of the company. You may also approach the National Consumer Helpline (1915, consumerhelpline.gov.in) or the consumer forum with jurisdiction over your place of residence.</p>
                <p className="text-muted-foreground mb-4">For a payment that your bank or card issuer has debited but not credited to us, you can also raise the matter with your bank under the RBI framework for failed transactions.</p>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Operator</h2>
                <p className="text-muted-foreground mb-4">Baalvion Industries Private Limited, CIN U43121OD2025PTC048479, GSTIN 21AANCB3490M1ZF. Registered office: C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha 764036, India. Operating office: Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India. Phone +91 89512 84770. Email support@baalvion.com.</p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
