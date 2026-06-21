/**
 * Role Selector - Choose access level for Protocol
 * TODO: Implement role-based authentication
 * TODO: Validate user permissions before allowing role access
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, GraduationCap, Crown, ChevronRight, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import AmbientBackground from "@/components/protocol/AmbientBackground";

const roles = [
  {
    id: "super-admin",
    title: "Super Admin",
    subtitle: "Platform Overseer",
    description: "Command the entire protocol network with full analytics and control",
    icon: Crown,
    route: "/protocol/admin",
    gradient: "from-amber-500 to-orange-600",
    borderColor: "border-amber-500/30 hover:border-amber-500/60",
    glowColor: "rgba(245, 158, 11, 0.3)"
  },
  {
    id: "expert",
    title: "Expert",
    subtitle: "CAD Owner",
    description: "Curate your knowledge domain and guide your disciples",
    icon: Shield,
    route: "/protocol/expert",
    gradient: "from-emerald-500 to-teal-600",
    borderColor: "border-emerald-500/30 hover:border-emerald-500/60",
    glowColor: "rgba(16, 185, 129, 0.3)"
  },
  {
    id: "student",
    title: "Student",
    subtitle: "Knowledge Seeker",
    description: "Access exclusive wisdom from elite thought leaders",
    icon: GraduationCap,
    route: "/protocol/student",
    gradient: "from-blue-500 to-indigo-600",
    borderColor: "border-blue-500/30 hover:border-blue-500/60",
    glowColor: "rgba(59, 130, 246, 0.3)"
  }
];

const RoleSelector = () => {
  const navigate = useNavigate();

  // Force dark mode for protocol pages
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AmbientBackground />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 border border-primary/30 rotate-45 flex items-center justify-center protocol-glow">
              <Eye className="w-5 h-5 text-primary -rotate-45" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.2em] text-foreground/90 mb-3">
            SELECT ACCESS LEVEL
          </h1>
          <p className="text-muted-foreground tracking-widest text-sm">
            Choose your role within the Protocol
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full">
          {roles.map((role, index) => (
            <Card
              key={role.id}
              onClick={() => navigate(role.route)}
              className={`group relative bg-card border ${role.borderColor} cursor-pointer transition-all duration-500 hover:translate-y-[-4px] animate-slide-up protocol-btn`}
              style={{ 
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {/* Glow effect on hover */}
              <div 
                className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-lg`} 
              />
              
              <div className="relative p-8">
                {/* Icon */}
                <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${role.gradient} p-0.5 mb-6 group-hover:shadow-lg transition-shadow`}>
                  <div className="w-full h-full bg-card rounded-lg flex items-center justify-center">
                    <role.icon className="w-7 h-7 text-foreground/80" />
                  </div>
                </div>

                {/* Content */}
                <h2 className="text-xl font-medium text-foreground/90 mb-1">
                  {role.title}
                </h2>
                <p className="text-primary/60 text-sm tracking-wider mb-3">
                  {role.subtitle}
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  {role.description}
                </p>

                {/* Enter button */}
                <div className="flex items-center text-muted-foreground group-hover:text-foreground transition-colors">
                  <span className="text-sm tracking-wider">Enter</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Back link */}
        <button
          onClick={() => navigate("/protocol")}
          className="mt-12 text-muted-foreground/50 hover:text-muted-foreground text-sm tracking-wider transition-colors protocol-btn"
        >
          ← Return to Protocol
        </button>
      </div>
    </div>
  );
};

export default RoleSelector;
