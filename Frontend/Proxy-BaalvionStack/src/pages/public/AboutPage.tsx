import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  Users, 
  Shield, 
  Zap,
  Target,
  Heart
} from "lucide-react";

const stats = [
  { label: "Customers Worldwide", value: "10,000+" },
  { label: "Countries Covered", value: "195+" },
  { label: "IP Pool Size", value: "72M+" },
  { label: "Uptime", value: "99.9%" },
];

const values = [
  {
    icon: Shield,
    title: "Security First",
    description: "We prioritize the security and privacy of our customers above everything else.",
  },
  {
    icon: Zap,
    title: "Performance Obsessed",
    description: "We constantly optimize our infrastructure to deliver the fastest possible experience.",
  },
  {
    icon: Users,
    title: "Customer Focused",
    description: "Our success is measured by our customers' success. We're here to help you grow.",
  },
  {
    icon: Heart,
    title: "Ethical Standards",
    description: "We maintain the highest ethical standards in how we source and manage our proxy network.",
  },
];

const team = [
  { name: "Vikram Sharma", role: "CEO & Co-Founder", image: "VS" },
  { name: "Priya Patel", role: "CTO & Co-Founder", image: "PP" },
  { name: "Arjun Reddy", role: "VP of Engineering", image: "AR" },
  { name: "Meera Krishnan", role: "VP of Operations", image: "MK" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              About Us
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Building the Future of{" "}
              <span className="text-primary">Proxy Infrastructure</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Baalvion NetStack was founded with a simple mission: to provide enterprise-grade 
              proxy infrastructure that's accessible, reliable, and ethically sourced.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Founded in 2020, Baalvion NetStack emerged from a simple observation: 
                  the proxy industry was fragmented, unreliable, and often operated in 
                  ethical gray areas.
                </p>
                <p>
                  Our founders, coming from backgrounds in network engineering and 
                  cybersecurity, set out to build something different—a proxy infrastructure 
                  company that combines enterprise-grade reliability with ethical sourcing 
                  practices.
                </p>
                <p>
                  Today, we serve thousands of businesses worldwide, from startups to 
                  Fortune 500 companies, helping them collect data, verify ads, monitor 
                  competitors, and much more—all while maintaining the highest standards 
                  of performance and ethics.
                </p>
              </div>
            </div>
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-8">
                <Target className="w-12 h-12 text-primary mb-6" />
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-muted-foreground">
                  To democratize access to enterprise-grade proxy infrastructure while 
                  maintaining the highest ethical standards in the industry. We believe 
                  that powerful tools should be accessible to everyone, not just large 
                  corporations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do at Baalvion NetStack.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="bg-background/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Leadership Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Meet the people driving Baalvion NetStack forward.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {team.map((member) => (
              <Card key={member.name} className="bg-background/50">
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary-foreground">{member.image}</span>
                  </div>
                  <h3 className="font-semibold mb-1">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Global Presence */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Global Presence</h2>
              <p className="text-muted-foreground">
                Headquartered in Bangalore, India, with offices and infrastructure worldwide.
              </p>
            </div>
            <Card className="bg-background/50">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <Globe className="w-10 h-10 text-primary mx-auto mb-4" />
                    <h4 className="font-semibold mb-2">Headquarters</h4>
                    <p className="text-sm text-muted-foreground">
                      Bangalore, India<br />
                      Koramangala Tech Park
                    </p>
                  </div>
                  <div className="text-center">
                    <Globe className="w-10 h-10 text-primary mx-auto mb-4" />
                    <h4 className="font-semibold mb-2">Americas</h4>
                    <p className="text-sm text-muted-foreground">
                      San Francisco, USA<br />
                      Market Street
                    </p>
                  </div>
                  <div className="text-center">
                    <Globe className="w-10 h-10 text-primary mx-auto mb-4" />
                    <h4 className="font-semibold mb-2">Europe</h4>
                    <p className="text-sm text-muted-foreground">
                      London, UK<br />
                      Canary Wharf
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
