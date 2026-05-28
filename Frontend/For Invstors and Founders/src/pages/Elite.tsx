import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Crown, Shield, Sparkles, Users, Zap, Lock } from "lucide-react";

export default function Elite() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Lock,
      title: "Exclusive Threads & Discussions",
      description: "Access confidential discussions reserved for verified elite members only"
    },
    {
      icon: Shield,
      title: "Confidential Private Circles",
      description: "Join invite-only circles with the most influential minds"
    },
    {
      icon: Sparkles,
      title: "AI-Powered Recommendations",
      description: "Get personalized thread suggestions based on your interests and expertise"
    },
    {
      icon: Zap,
      title: "Real-Time Notifications",
      description: "Stay updated with instant alerts on topics that matter to you"
    },
    {
      icon: Users,
      title: "Verified Network",
      description: "Connect with verified founders, investors, and innovators"
    }
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--elite-bg-dark))] text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--elite-gold-dark))]/20 via-transparent to-transparent" />
        
        <div className="container max-w-6xl mx-auto relative z-10">
          <div className="text-center space-y-6 mb-12">
            <div className="flex justify-center mb-6">
              <Crown className="h-20 w-20 text-[hsl(var(--elite-gold))]" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-[hsl(var(--elite-gold))] via-[hsl(var(--elite-gold-dark))] to-[hsl(var(--elite-gold))] bg-clip-text text-transparent">
              Elite Members Club
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Knowledge, strategy, and influence converge here. Apply to join the most exclusive network of founders, investors, and innovators.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button
                onClick={() => navigate("/elite/apply")}
                size="lg"
                className="bg-[hsl(var(--elite-gold))] hover:bg-[hsl(var(--elite-gold-dark))] text-black font-semibold px-8 py-6 text-lg"
              >
                Apply for Membership
              </Button>
              
              <Button
                onClick={() => navigate("/elite/premium")}
                size="lg"
                variant="outline"
                className="border-[hsl(var(--elite-border-gold))] text-[hsl(var(--elite-gold))] hover:bg-[hsl(var(--elite-gold))]/10 px-8 py-6 text-lg"
              >
                View Pricing
              </Button>
              
              <Button
                onClick={() => navigate("/elite/status")}
                size="lg"
                variant="outline"
                className="border-[hsl(var(--elite-border-gold))] text-[hsl(var(--elite-gold))] hover:bg-[hsl(var(--elite-gold))]/10 px-8 py-6 text-lg"
              >
                Check Status
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-[hsl(var(--elite-card-dark))]">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--elite-gold))]">
            What You Get
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-[hsl(var(--elite-bg-dark))] border-[hsl(var(--elite-border-gold))] p-6 hover:border-[hsl(var(--elite-gold))] transition-all"
              >
                <feature.icon className="h-10 w-10 text-[hsl(var(--elite-gold))] mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Join the Elite?
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Applications are reviewed by our moderation team. Only verified members gain access to our exclusive platform.
          </p>
          <Button
            onClick={() => navigate("/elite/apply")}
            size="lg"
            className="bg-[hsl(var(--elite-gold))] hover:bg-[hsl(var(--elite-gold-dark))] text-black font-semibold px-12 py-6 text-lg"
          >
            Start Your Application
          </Button>
        </div>
      </section>
    </div>
  );
}
