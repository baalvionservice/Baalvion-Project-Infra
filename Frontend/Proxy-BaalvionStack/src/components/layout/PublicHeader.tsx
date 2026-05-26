import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { label: "Pricing", path: "/pricing" },
  { label: "Enterprise", path: "/enterprise" },
  { label: "Integrations", path: "/integrations" },
  { label: "Docs", path: "/docs" },
  { label: "Status", path: "/status" },
];

const productLinks = [
  { label: "Residential Proxies", path: "/residential", description: "Real IPs from residential networks" },
  { label: "Mobile Proxies", path: "/mobile", description: "4G/5G mobile carrier IPs" },
  { label: "Datacenter Proxies", path: "/datacenter", description: "Fast datacenter IPs" },
  { label: "Proxy Comparison", path: "/proxy-comparison", description: "Compare all proxy types" },
];

const resourceLinks = [
  { label: "Case Studies", path: "/case-studies", description: "Customer success stories" },
  { label: "Infrastructure", path: "/infrastructure", description: "Global network overview" },
  { label: "Calculator", path: "/calculator", description: "Estimate your costs" },
  { label: "FAQ", path: "/faq", description: "Common questions answered" },
  { label: "Blog", path: "/blog", description: "Guides & updates" },
];

export function PublicHeader() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isProductPage = productLinks.some(p => location.pathname === p.path);
  const isResourcePage = resourceLinks.some(p => location.pathname === p.path);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground">Baalvion</span>
            <span className="text-xs text-muted-foreground">NetStack</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1", isProductPage ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary")}>
                Products<ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {productLinks.map(link => (
                <DropdownMenuItem key={link.path} asChild>
                  <Link to={link.path} className="flex flex-col items-start gap-0.5 py-2">
                    <span className="font-medium">{link.label}</span>
                    <span className="text-xs text-muted-foreground">{link.description}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1", isResourcePage ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary")}>
                Resources<ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {resourceLinks.map(link => (
                <DropdownMenuItem key={link.path} asChild>
                  <Link to={link.path} className="flex flex-col items-start gap-0.5 py-2">
                    <span className="font-medium">{link.label}</span>
                    <span className="text-xs text-muted-foreground">{link.description}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {navLinks.map(link => (
            <Link key={link.path} to={link.path} className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-colors", location.pathname === link.path ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary")}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" asChild><Link to="/login">Sign In</Link></Button>
          <Button variant="hero" asChild><Link to="/signup">Start Free Trial</Link></Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-2">
          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Products</div>
          {productLinks.map(link => (
            <Link key={link.path} to={link.path} className="block px-4 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => setMobileMenuOpen(false)}>{link.label}</Link>
          ))}
          <div className="border-t border-border my-2" />
          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resources</div>
          {resourceLinks.map(link => (
            <Link key={link.path} to={link.path} className="block px-4 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => setMobileMenuOpen(false)}>{link.label}</Link>
          ))}
          <div className="border-t border-border my-2" />
          {navLinks.map(link => (
            <Link key={link.path} to={link.path} className="block px-4 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => setMobileMenuOpen(false)}>{link.label}</Link>
          ))}
          <div className="pt-4 space-y-2 border-t border-border mt-4">
            <Button variant="ghost" className="w-full" asChild><Link to="/login">Sign In</Link></Button>
            <Button variant="hero" className="w-full" asChild><Link to="/signup">Start Free Trial</Link></Button>
          </div>
        </div>
      )}
    </header>
  );
}
