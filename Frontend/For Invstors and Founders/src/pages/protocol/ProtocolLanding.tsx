/**
 * Protocol Landing Page - Entry point for the private expertise platform
 * TODO: Implement actual invite code validation
 * TODO: Connect to auth system for member verification
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import AmbientBackground from "@/components/protocol/AmbientBackground";

const ProtocolLanding = () => {
  const navigate = useNavigate();

  // Force dark mode for protocol pages
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      // Cleanup if needed when leaving protocol
    };
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AmbientBackground />

      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/10 rounded-full animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-primary/5 rounded-full" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Logo/Symbol */}
        <div className="mb-8 animate-fade-in">
          <div className="relative protocol-glow">
            <div className="w-24 h-24 border-2 border-primary/30 rotate-45 flex items-center justify-center hover:border-primary/60 transition-colors duration-500">
              <Eye className="w-10 h-10 text-primary -rotate-45" />
            </div>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary/50 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-light tracking-[0.3em] text-foreground/90 mb-4 text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
          PROTOCOL
        </h1>
        <p className="text-primary/60 tracking-[0.5em] text-xs md:text-sm uppercase mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Private Expertise Network
        </p>

        {/* Tagline */}
        <p className="text-muted-foreground text-center max-w-md mb-12 leading-relaxed animate-fade-in" style={{ animationDelay: '0.3s' }}>
          An invite-only sanctum for elite knowledge transfer. 
          <span className="text-primary/60"> Access requires clearance.</span>
        </p>

        {/* Enter Button */}
        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Button
            onClick={() => navigate("/protocol/select-role")}
            className="group relative bg-transparent border border-primary/30 hover:border-primary/60 text-primary hover:text-primary px-12 py-6 text-lg tracking-widest transition-all duration-500 hover:shadow-[0_0_40px_hsl(var(--primary)/0.3)] protocol-btn"
          >
            <span className="relative z-10 flex items-center gap-3">
              <Lock className="w-4 h-4" />
              ENTER PROTOCOL
              <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
          </Button>
        </div>

        {/* Bottom decorative elements */}
        <div className="absolute bottom-8 flex items-center gap-8 text-muted-foreground/40 text-xs tracking-widest animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3" />
            <span>ENCRYPTED</span>
          </div>
          <div className="w-px h-4 bg-muted-foreground/20" />
          <span>EST. 2024</span>
          <div className="w-px h-4 bg-muted-foreground/20" />
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3" />
            <span>PRIVATE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtocolLanding;
