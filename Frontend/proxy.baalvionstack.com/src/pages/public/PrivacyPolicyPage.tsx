import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              Legal
            </Badge>
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last updated: December 24, 2024
            </p>
          </div>

          {/* Content */}
          <Card className="bg-card/50">
            <CardContent className="p-8 md:p-12 prose prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                <p className="text-muted-foreground mb-4">
                  Baalvion Industries Private Limited ("Baalvion NetStack," "we," "us," or "our") 
                  is committed to protecting your privacy. This Privacy Policy explains how we 
                  collect, use, disclose, and safeguard your information when you use our proxy 
                  services and visit our website.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
                <h3 className="text-lg font-semibold mb-2">2.1 Personal Information</h3>
                <p className="text-muted-foreground mb-4">
                  We may collect personal information that you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Name and contact information (email address, phone number)</li>
                  <li>Billing information (credit card details, billing address)</li>
                  <li>Account credentials (username, password)</li>
                  <li>Company information (company name, job title)</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2">2.2 Usage Information</h3>
                <p className="text-muted-foreground mb-4">
                  We automatically collect certain information when you use our services:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>IP addresses and device information</li>
                  <li>Browser type and operating system</li>
                  <li>Usage patterns and preferences</li>
                  <li>Bandwidth consumption and request logs</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-4">
                  We use the information we collect for the following purposes:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>To provide, maintain, and improve our services</li>
                  <li>To process transactions and send related information</li>
                  <li>To send technical notices and support messages</li>
                  <li>To respond to your comments and questions</li>
                  <li>To detect, investigate, and prevent fraudulent transactions</li>
                  <li>To comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">4. Information Sharing</h2>
                <p className="text-muted-foreground mb-4">
                  We do not sell, trade, or rent your personal information to third parties. 
                  We may share your information in the following circumstances:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>With service providers who assist in our operations</li>
                  <li>To comply with legal obligations or court orders</li>
                  <li>To protect our rights, privacy, safety, or property</li>
                  <li>In connection with a merger, acquisition, or sale of assets</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
                <p className="text-muted-foreground mb-4">
                  We implement appropriate technical and organizational measures to protect 
                  your personal information against unauthorized access, alteration, disclosure, 
                  or destruction. These measures include:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and audits</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Employee training on data protection</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">6. Data Retention</h2>
                <p className="text-muted-foreground mb-4">
                  We retain your personal information for as long as necessary to fulfill the 
                  purposes for which it was collected, including to satisfy legal, accounting, 
                  or reporting requirements. Usage logs are typically retained for 30 days.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">7. Your Rights</h2>
                <p className="text-muted-foreground mb-4">
                  Depending on your location, you may have the following rights:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Right to access your personal information</li>
                  <li>Right to rectify inaccurate information</li>
                  <li>Right to erasure ("right to be forgotten")</li>
                  <li>Right to restrict processing</li>
                  <li>Right to data portability</li>
                  <li>Right to object to processing</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">8. Cookies and Tracking</h2>
                <p className="text-muted-foreground mb-4">
                  We use cookies and similar tracking technologies to track activity on our 
                  website and hold certain information. You can instruct your browser to 
                  refuse all cookies or to indicate when a cookie is being sent.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">9. International Transfers</h2>
                <p className="text-muted-foreground mb-4">
                  Your information may be transferred to and processed in countries other 
                  than your country of residence. We ensure appropriate safeguards are in 
                  place for such transfers in accordance with applicable laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">10. Contact Us</h2>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <div className="bg-secondary/30 rounded-lg p-4 text-muted-foreground">
                  <p>Baalvion Industries Private Limited</p>
                  <p>Email: privacy@baalvion.com</p>
                  <p>Address: Koramangala Tech Park, Bangalore, India 560034</p>
                </div>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
