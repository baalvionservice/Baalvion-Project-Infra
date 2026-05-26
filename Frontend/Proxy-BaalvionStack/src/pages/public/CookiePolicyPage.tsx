import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cookie, Shield, ToggleLeft, BarChart3 } from "lucide-react";

const cookieTypes = [
  {
    icon: Shield,
    name: "Strictly Necessary",
    badge: "Required",
    badgeVariant: "destructive" as const,
    description: "These cookies are essential for the website to function and cannot be switched off. They are usually only set in response to actions made by you which amount to a request for services.",
    examples: ["Session authentication token", "CSRF protection token", "Load balancer affinity", "Cookie consent preference"],
    canOptOut: false,
    retention: "Session / 1 year",
  },
  {
    icon: BarChart3,
    name: "Analytics & Performance",
    badge: "Optional",
    badgeVariant: "secondary" as const,
    description: "These cookies help us understand how visitors interact with our website. All information collected is aggregated and anonymous.",
    examples: ["Page view counts", "Session duration", "Error tracking", "Feature usage metrics"],
    canOptOut: true,
    retention: "13 months",
  },
  {
    icon: ToggleLeft,
    name: "Functional",
    badge: "Optional",
    badgeVariant: "secondary" as const,
    description: "These cookies enable the website to provide enhanced functionality and personalisation. They may be set by us or by third party providers.",
    examples: ["Theme preference (dark/light)", "Language preference", "Dashboard layout settings", "Sidebar collapse state"],
    canOptOut: true,
    retention: "1 year",
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <SEOHead
        title="Cookie Policy – Baalvion NetStack"
        description="Baalvion NetStack cookie policy. Learn how we use cookies and how to manage your cookie preferences."
        canonical="/cookies"
      />

      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
          <Cookie className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Legal</span>
        </div>
        <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
        <p className="text-muted-foreground">
          Last updated: February 1, 2026
        </p>
      </div>

      <div className="space-y-8">
        {/* Intro */}
        <Card variant="glass">
          <CardContent className="p-6">
            <p className="text-muted-foreground leading-relaxed">
              Baalvion Industries Private Limited ("Baalvion", "we", "us") uses cookies and similar tracking technologies
              on the Baalvion NetStack platform. This Cookie Policy explains what cookies are, how we use them, and
              your choices regarding cookies. By using our platform you agree to the use of strictly necessary cookies.
              All other categories are optional and can be managed in your account settings.
            </p>
          </CardContent>
        </Card>

        {/* What are cookies */}
        <div>
          <h2 className="text-xl font-bold mb-3">What Are Cookies?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cookies are small text files that are placed on your device when you visit a website. They are widely used
            to make websites work efficiently and to provide information to the website owner. Cookies can be "session"
            cookies that expire when you close your browser, or "persistent" cookies that remain for a set period.
          </p>
        </div>

        {/* Cookie types */}
        <div>
          <h2 className="text-xl font-bold mb-4">Types of Cookies We Use</h2>
          <div className="space-y-4">
            {cookieTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card key={type.name}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        {type.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={type.badgeVariant}>{type.badge}</Badge>
                        {type.canOptOut
                          ? <Badge variant="outline" className="text-xs">Can opt-out</Badge>
                          : <Badge variant="outline" className="text-xs text-muted-foreground">Cannot opt-out</Badge>
                        }
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Examples:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {type.examples.map(ex => (
                          <span key={ex} className="text-xs px-2 py-1 rounded-md bg-secondary/50 text-muted-foreground">{ex}</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Retention:</span> {type.retention}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Third-party cookies */}
        <div>
          <h2 className="text-xl font-bold mb-3">Third-Party Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We do not use third-party advertising or social media cookies. Our platform may use cookies from
            infrastructure providers such as Cloudflare (for security and performance). These providers have their
            own privacy policies and we recommend reviewing them separately.
          </p>
        </div>

        {/* Managing cookies */}
        <div>
          <h2 className="text-xl font-bold mb-3">Managing Your Cookie Preferences</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            You can manage your cookie preferences at any time:
          </p>
          <ul className="space-y-2 text-muted-foreground text-sm list-disc list-inside">
            <li><span className="font-medium text-foreground">Platform Settings:</span> Go to Account Settings → Privacy → Cookie Preferences</li>
            <li><span className="font-medium text-foreground">Browser Settings:</span> Most browsers allow you to refuse cookies via their settings menu</li>
            <li><span className="font-medium text-foreground">Note:</span> Disabling strictly necessary cookies may prevent the platform from functioning correctly</li>
          </ul>
        </div>

        {/* Contact */}
        <Card variant="glass">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Questions About This Policy?</h3>
            <p className="text-sm text-muted-foreground">
              If you have any questions about our use of cookies, please contact us at{" "}
              <a href="mailto:privacy@baalvion.com" className="text-primary hover:underline">privacy@baalvion.com</a>{" "}
              or visit our <a href="/contact" className="text-primary hover:underline">Contact page</a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
