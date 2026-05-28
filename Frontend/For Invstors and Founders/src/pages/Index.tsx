import { Link } from "react-router-dom";
import {
  ArrowRight, Lock, Zap, ShieldCheck, TrendingUp, Users, Briefcase,
  MessageSquare, Sparkles, CheckCircle2, Crown, Star, Eye, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  { value: "₹2.5 Cr+", label: "Deal Flow This Week", icon: TrendingUp },
  { value: "120+", label: "Active Investors", icon: Users },
  { value: "35", label: "Live Opportunities", icon: Briefcase },
  { value: "Daily", label: "High-Value Discussions", icon: MessageSquare },
];

const featuredDeals = [
  { title: "AI Fintech Platform", pitch: "B2B credit-decisioning engine for emerging markets.", funding: "₹4 Cr", returns: "3x in 24 months", interested: 18, stage: "Series A" },
  { title: "D2C Wellness Brand", pitch: "Profitable Ayurvedic skincare scaling to global retail.", funding: "₹1.8 Cr", returns: "2.5x in 18 months", interested: 24, stage: "Bridge" },
  { title: "Climate Infra SaaS", pitch: "Carbon accounting for mid-market manufacturers.", funding: "₹6 Cr", returns: "4x in 36 months", interested: 11, stage: "Seed+" },
  { title: "Vertical AI for Legal", pitch: "Contract intelligence platform with 40+ enterprise clients.", funding: "₹9 Cr", returns: "3.2x in 30 months", interested: 31, stage: "Series A" },
];

const members = [
  { name: "Arjun Mehta", role: "Investor", company: "Helios Capital", line: "Backed 12 startups · 4 exits" },
  { name: "Priya Raman", role: "Founder", company: "Nexus Health", line: "Scaled to ₹120 Cr ARR" },
  { name: "Vikram Shah", role: "Operator", company: "Ex-VP, Razorpay", line: "Built payments at scale" },
  { name: "Neha Kapoor", role: "Investor", company: "BlueGate Ventures", line: "$80M AUM · Fintech focus" },
  { name: "Rohan Iyer", role: "Founder", company: "Forge Robotics", line: "Series B · Sequoia-backed" },
  { name: "Anjali Desai", role: "Investor", company: "Angel · 30+ checks", line: "Top 1% angel by IRR" },
];

const liveActivity = [
  { type: "Discussion", title: "Why AI infrastructure is the biggest opportunity in 2026", meta: "Arjun Mehta · 42 replies" },
  { type: "Deal", title: "New: AI Fintech Platform — ₹4 Cr round opening Friday", meta: "18 investors interested" },
  { type: "Insight", title: "Breaking down the D2C exit playbook from 3 recent acquisitions", meta: "Priya Raman · 89 likes" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px]" />
      </div>

      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-[hsl(38,92%,50%)] rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Baalvion <span className="text-primary">Insiders</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#deals" className="hover:text-foreground transition">Deals</a>
            <a href="#network" className="hover:text-foreground transition">Network</a>
            <a href="#how" className="hover:text-foreground transition">How it works</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link to="/auth">Sign In</Link></Button>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link to="/elite/apply">Apply for Access<ArrowRight className="ml-1.5 w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="container mx-auto px-6 pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary tracking-wide uppercase">Invite-Only · Verified Network</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-7 leading-[1.05] tracking-tight">
            Private Network for
            <span className="block bg-gradient-to-r from-primary via-[hsl(45,93%,68%)] to-[hsl(38,92%,50%)] bg-clip-text text-transparent">
              Investors & Founders
            </span>
            to Access High-Return Opportunities
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Join a curated circle of verified investors, founders, and operators. Discover private deals, share insights, and build wealth through real opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-7 h-12" asChild>
              <Link to="/elite/apply">Apply for Access<ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-7 h-12 border-primary/30 hover:bg-primary/5" asChild>
              <a href="#deals">View Active Deals</a>
            </Button>
          </div>
          <div className="mt-10 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> Manually Reviewed</div>
            <div className="flex items-center gap-1.5"><Crown className="w-3.5 h-3.5 text-primary" /> Limited Approvals</div>
            <div className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-primary" /> Verified Members Only</div>
          </div>
        </div>
      </section>

      {/* PROOF STRIP */}
      <section className="container mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {stats.map((s) => (
            <Card key={s.label} className="bg-card/60 backdrop-blur border-primary/10 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group">
              <CardContent className="p-6">
                <s.icon className="w-5 h-5 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <div className="text-2xl md:text-3xl font-bold tracking-tight">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FEATURED DEALS */}
      <section id="deals" className="container mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10 max-w-6xl mx-auto">
          <div>
            <Badge variant="outline" className="border-primary/40 text-primary mb-3">Featured Opportunities</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Live Deals This Week</h2>
            <p className="text-muted-foreground mt-2">Curated, vetted, and open to verified members only.</p>
          </div>
          <Button variant="ghost" className="hidden md:flex text-primary hover:text-primary" asChild>
            <Link to="/marketplace">View all<ArrowUpRight className="ml-1 w-4 h-4" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-6xl mx-auto">
          {featuredDeals.map((d) => (
            <Card key={d.title} className="bg-gradient-to-br from-card via-card to-card/40 border-primary/10 hover:border-primary/40 hover:shadow-[0_0_40px_-10px_hsl(45_93%_58%_/_0.3)] transition-all duration-300 group overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
              <CardContent className="p-7">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline" className="border-primary/30 text-primary text-xs">{d.stage}</Badge>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Eye className="w-3.5 h-3.5" />{d.interested} interested
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{d.title}</h3>
                <p className="text-sm text-muted-foreground mb-5">{d.pitch}</p>
                <div className="grid grid-cols-2 gap-4 mb-5 pt-4 border-t border-border/50">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Funding</div>
                    <div className="text-base font-semibold mt-0.5">{d.funding}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Expected Return</div>
                    <div className="text-base font-semibold text-primary mt-0.5">{d.returns}</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full border-primary/30 hover:bg-primary hover:text-primary-foreground" asChild>
                  <Link to="/auth">View Deal<ArrowRight className="ml-2 w-3.5 h-3.5" /></Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* MEMBER SHOWCASE */}
      <section id="network" className="container mx-auto px-6 py-20">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <Badge variant="outline" className="border-primary/40 text-primary mb-3">Inside the Network</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built by Operators. Trusted by Capital.</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {members.map((m) => (
            <Card key={m.name} className="bg-card/60 border-primary/10 hover:border-primary/40 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center font-bold text-primary">
                    {m.name.split(" ").map(w=>w[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold truncate">{m.name}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{m.role} · {m.company}</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{m.line}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* LIVE ACTIVITY */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="outline" className="border-primary/40 text-primary mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
              Live Inside Baalvion
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Real conversations. Real capital. Real-time.</h2>
          </div>
          <div className="space-y-3">
            {liveActivity.map((a) => (
              <Card key={a.title} className="bg-card/60 border-primary/10 hover:border-primary/40 transition-all">
                <CardContent className="p-5 flex items-center gap-4">
                  <Badge className="bg-primary/15 text-primary hover:bg-primary/20 border-0 text-[10px] uppercase tracking-wider">{a.type}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{a.meta}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <Badge variant="outline" className="border-primary/40 text-primary mb-3">How It Works</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Three steps to access</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {[
            { n: "01", title: "Apply for Access", desc: "Submit your profile and credentials.", icon: Sparkles },
            { n: "02", title: "Get Verified", desc: "Manual review by our partnerships team.", icon: ShieldCheck },
            { n: "03", title: "Access Deals & Network", desc: "Engage with deals, founders, and capital.", icon: Crown },
          ].map((s) => (
            <Card key={s.n} className="bg-card/60 border-primary/10 relative">
              <CardContent className="p-7">
                <div className="text-5xl font-bold text-primary/20 mb-2">{s.n}</div>
                <s.icon className="w-6 h-6 text-primary mb-3" />
                <h3 className="text-lg font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* EXCLUSIVITY */}
      <section className="container mx-auto px-6 py-20">
        <Card className="max-w-5xl mx-auto bg-gradient-to-br from-card via-card/80 to-primary/5 border-primary/20">
          <CardContent className="p-10 md:p-14">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <Badge variant="outline" className="border-primary/40 text-primary mb-4">Who Can Join</Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-5 tracking-tight">Selective by design.</h2>
                <p className="text-muted-foreground mb-6">Baalvion isn't built for everyone. We approve a limited number of members each month to preserve signal density.</p>
                <div className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>All applications are manually reviewed</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-2">
                  <Crown className="w-4 h-4 text-primary" />
                  <span>Limited approvals per month</span>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  "Founders building scalable companies",
                  "Active investors (Angel, VC, HNI)",
                  "Operators with proven experience",
                ].map((x) => (
                  <div key={x} className="flex items-center gap-3 p-4 rounded-lg bg-background/40 border border-primary/10">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm">{x}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* VALUE PROP */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="border-primary/40 text-primary mb-3">Inside Baalvion You Can</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Outcomes, not features.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: Briefcase, title: "Discover Private Investment Opportunities", desc: "Off-market deals shared first inside the network." },
              { icon: Users, title: "Connect Directly with Founders & Investors", desc: "No noise. Direct DMs with verified members only." },
              { icon: Star, title: "Build Reputation & Influence", desc: "Earn standing through contribution, not credentials." },
              { icon: TrendingUp, title: "Access Emerging Markets Early", desc: "Get in before the deal becomes public." },
            ].map((v) => (
              <Card key={v.title} className="bg-card/60 border-primary/10 hover:border-primary/40 transition-all">
                <CardContent className="p-6 flex gap-4">
                  <div className="p-2.5 h-fit rounded-lg bg-primary/10">
                    <v.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{v.title}</h3>
                    <p className="text-sm text-muted-foreground">{v.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 blur-3xl -z-10" />
          <Badge variant="outline" className="border-primary/40 text-primary mb-5">
            <Lock className="w-3 h-3 mr-1.5" /> Access Is Limited
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Where opportunity meets capital.
            </span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Join a private network where real opportunities and high-value connections exist.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12" asChild>
              <Link to="/elite/apply">Request Invitation<ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary/30 px-8 h-12" asChild>
              <Link to="/elite/apply">Apply Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/50 bg-card/20">
        <div className="container mx-auto px-6 py-10">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-[hsl(38,92%,50%)] rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold">Baalvion <span className="text-primary">Insiders</span></span>
              </div>
              <p className="text-xs text-muted-foreground">Private · Secure · Verified Network</p>
            </div>
            <div className="text-sm">
              <div className="font-semibold mb-3 text-xs uppercase tracking-wider text-primary/80">Network</div>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/elite/apply" className="hover:text-foreground">Apply for Access</Link></li>
                <li><Link to="/marketplace" className="hover:text-foreground">Active Deals</Link></li>
                <li><Link to="/forums" className="hover:text-foreground">Forums</Link></li>
              </ul>
            </div>
            <div className="text-sm">
              <div className="font-semibold mb-3 text-xs uppercase tracking-wider text-primary/80">Trust</div>
              <ul className="space-y-2 text-muted-foreground">
                <li>Manually Reviewed Members</li>
                <li>Verified Investors & Founders</li>
                <li>End-to-End Privacy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>© 2026 Baalvion Insiders. All rights reserved.</div>
            <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> Invite-only · Limited approvals per month</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
