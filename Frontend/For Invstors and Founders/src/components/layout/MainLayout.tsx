import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { 
  Zap, Search, Menu, X, Moon, Sun, LogOut, ChevronDown, Shield, MapPin, BookOpen,
  MessageSquare, ShoppingBag, LayoutDashboard, User, Trophy, Sparkles, Briefcase, Wallet, Handshake, Rocket, Crown, Pencil, ClipboardList, KanbanSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AIAssistant } from "@/components/ai/AIAssistant";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      }
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error("Failed to load profile:", error);
    }
  };

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('insiders.theme', next ? 'dark' : 'light'); } catch { /* ignore */ }
    toast({
      title: darkMode ? "Light mode enabled" : "Dark mode enabled",
      duration: 2000,
    });
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      sonnerToast.success("Logged out successfully");
      navigate("/auth");
    } catch (error: any) {
      console.error("Logout error:", error);
      sonnerToast.error("Failed to log out");
    }
  };

  // The directory is the product for a first-time visitor, so it carries the bar on its own.
  // Everything else needs an account, so it sits one click away under "More" rather than
  // filling the nav with links that bounce a logged-out founder to /auth.
  const primaryNav = [
    { path: "/investors", label: "Investors", icon: Wallet },
    { path: "/founders", label: "Companies", icon: Rocket },
    { path: "/directory", label: "Locations", icon: MapPin },
    { path: "/guides", label: "Guides", icon: BookOpen },
  ];
  const memberNav = [
    { path: "/dashboard", label: "Feed", icon: LayoutDashboard },
    { path: "/deals", label: "Deals", icon: Briefcase },
    { path: "/forums", label: "Forums", icon: MessageSquare },
    { path: "/marketplace", label: "Marketplace", icon: ShoppingBag },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { path: "/elite/premium", label: "Elite", icon: Sparkles },
  ];
  const navItems = [...primaryNav, ...memberNav];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold tracking-tight hidden sm:block">
                Baalvion <span className="text-primary">Insiders</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {primaryNav.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "secondary" : "ghost"}
                    asChild
                  >
                    <Link to={item.path} className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={memberNav.some((i) => location.pathname.startsWith(i.path)) ? "secondary" : "ghost"}>
                    More
                    <ChevronDown className="w-4 h-4 ml-1 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Members</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {memberNav.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.path} asChild>
                        <Link to={item.path} className="cursor-pointer">
                          <Icon className="w-4 h-4 mr-2" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <form
                className="relative hidden lg:block"
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = searchTerm.trim();
                  if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
                }}
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search firms, companies, people"
                  aria-label="Search the directory"
                  className="pl-10 w-64 bg-secondary/50 border-border"
                />
              </form>

              {/* AI Assistant Button */}
              <Button variant="ghost" size="icon" className="hidden sm:flex" aria-label="Open AI assistant">
                <Sparkles className="w-5 h-5 text-primary" />
              </Button>

              {/* Theme Toggle */}
              <Button variant="ghost" size="icon" onClick={toggleDarkMode} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              {/* Notifications */}
              {user && <NotificationBell userId={user.id} />}

              {/* Profile */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="premium" size="sm" className="hidden sm:flex">
                      <User className="w-4 h-4 mr-2" />
                      {profile?.username || 'Profile'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user?.roles?.includes("admin") && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/investors" className="cursor-pointer">
                            <Wallet className="w-4 h-4 mr-2" />
                            Manage investors
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/companies" className="cursor-pointer">
                            <Rocket className="w-4 h-4 mr-2" />
                            Manage companies
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="cursor-pointer">
                            <Shield className="w-4 h-4 mr-2" />
                            Admin panel
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/onboarding" className="cursor-pointer">
                        <ClipboardList className="w-4 h-4 mr-2" />
                        Complete Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile/edit" className="cursor-pointer">
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/pipeline" className="cursor-pointer">
                        <KanbanSquare className="w-4 h-4 mr-2" />
                        Pipeline
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/connections" className="cursor-pointer">
                        <Handshake className="w-4 h-4 mr-2" />
                        My Connections
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/membership" className="cursor-pointer">
                        <Crown className="w-4 h-4 mr-2" />
                        Membership
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/elite/status" className="cursor-pointer">
                        <Trophy className="w-4 h-4 mr-2" />
                        Elite Status
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="premium" size="sm" asChild className="hidden sm:flex">
                  <Link to="/auth">Sign In</Link>
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-2">
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <div key={item.path}>
                    {idx === primaryNav.length && (
                      <div className="pt-3 pb-1 px-3 text-xs uppercase tracking-wide text-muted-foreground">Members</div>
                    )}
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      asChild
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link to={item.path}>
                        <Icon className="w-4 h-4 mr-2" />
                        {item.label}
                      </Link>
                    </Button>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-border">
                {user ? (
                  <Button variant="premium" className="w-full" asChild>
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </Button>
                ) : (
                  <Button variant="premium" className="w-full" asChild>
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-64px)]">
        {children}
      </main>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
}
