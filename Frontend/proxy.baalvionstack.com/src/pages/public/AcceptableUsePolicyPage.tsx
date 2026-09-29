import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

export default function AcceptableUsePolicyPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              Legal
            </Badge>
            <h1 className="text-4xl font-bold mb-4">Acceptable Use Policy</h1>
            <p className="text-muted-foreground">
              Last updated: December 24, 2024
            </p>
          </div>

          {/* Warning Banner */}
          <Card className="bg-destructive/10 border-destructive/20 mb-8">
            <CardContent className="p-6 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive mb-1">Important Notice</h3>
                <p className="text-sm text-muted-foreground">
                  Violation of this Acceptable Use Policy may result in immediate termination 
                  of your account without refund. Please read carefully before using our services.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card className="bg-card/50">
            <CardContent className="p-8 md:p-12 prose prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                <p className="text-muted-foreground mb-4">
                  This Acceptable Use Policy ("AUP") governs your use of Baalvion NetStack's 
                  proxy services. By using our services, you agree to comply with this policy. 
                  We reserve the right to modify this policy at any time.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">2. Permitted Uses</h2>
                <p className="text-muted-foreground mb-4">
                  Our proxy services may be used for legitimate business purposes, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Web scraping of publicly available data</li>
                  <li>Market research and competitive analysis</li>
                  <li>Ad verification and brand protection</li>
                  <li>SEO monitoring and SERP tracking</li>
                  <li>Price comparison and e-commerce intelligence</li>
                  <li>Academic research</li>
                  <li>Quality assurance and testing</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">3. Prohibited Uses</h2>
                <p className="text-muted-foreground mb-4">
                  The following activities are strictly prohibited:
                </p>
                
                <h3 className="text-lg font-semibold mb-2">3.1 Illegal Activities</h3>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Any activity that violates applicable laws or regulations</li>
                  <li>Fraud, phishing, or identity theft</li>
                  <li>Distribution of malware or viruses</li>
                  <li>Money laundering or terrorist financing</li>
                  <li>Child exploitation or trafficking</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2">3.2 Harmful Activities</h3>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>DDoS attacks or network abuse</li>
                  <li>Spam or unsolicited bulk messaging</li>
                  <li>Hacking, cracking, or unauthorized access</li>
                  <li>Harassment, stalking, or threatening behavior</li>
                  <li>Distribution of hate speech or violent content</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2">3.3 Intellectual Property Violations</h3>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Copyright or trademark infringement</li>
                  <li>Scraping copyrighted content for redistribution</li>
                  <li>Circumventing access controls or DRM</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2">3.4 Terms of Service Violations</h3>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Violating third-party terms of service in ways that could harm Baalvion NetStack</li>
                  <li>Activities that could damage our reputation or infrastructure</li>
                  <li>Reselling services without authorization</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">4. Rate Limits and Fair Use</h2>
                <p className="text-muted-foreground mb-4">
                  To ensure service quality for all users:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Respect target website rate limits and robots.txt directives</li>
                  <li>Do not overwhelm target servers with excessive requests</li>
                  <li>Use appropriate delays between requests</li>
                  <li>Monitor and optimize your request patterns</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">5. Account Security</h2>
                <p className="text-muted-foreground mb-4">
                  You are responsible for:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Maintaining the confidentiality of your credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Immediately reporting any unauthorized use</li>
                  <li>Not sharing accounts or API keys with unauthorized parties</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">6. Monitoring and Enforcement</h2>
                <p className="text-muted-foreground mb-4">
                  We reserve the right to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Monitor usage patterns for policy compliance</li>
                  <li>Investigate suspected violations</li>
                  <li>Suspend or terminate accounts that violate this policy</li>
                  <li>Report illegal activities to law enforcement</li>
                  <li>Cooperate with legal authorities when required</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">7. Consequences of Violations</h2>
                <p className="text-muted-foreground mb-4">
                  Violations of this AUP may result in:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Warning and required corrective action</li>
                  <li>Temporary suspension of services</li>
                  <li>Immediate termination without refund</li>
                  <li>Legal action and damages claims</li>
                  <li>Reporting to law enforcement</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">8. Reporting Violations</h2>
                <p className="text-muted-foreground mb-4">
                  If you become aware of any violation of this policy, please report it to:
                </p>
                <div className="bg-secondary/30 rounded-lg p-4 text-muted-foreground">
                  <p>Email: abuse@baalvion.com</p>
                  <p>Include: Your contact information, details of the violation, and any supporting evidence</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
                <p className="text-muted-foreground mb-4">
                  For questions about this Acceptable Use Policy:
                </p>
                <div className="bg-secondary/30 rounded-lg p-4 text-muted-foreground">
                  <p>Baalvion Industries Private Limited</p>
                  <p>Email: legal@baalvion.com</p>
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
