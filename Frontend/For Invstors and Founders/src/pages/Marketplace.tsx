import { Link } from "react-router-dom";
import { ShoppingBag, Plane, Server, GraduationCap, Star, Zap, Bell, Search, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const Marketplace = () => {
  const products = [
    {
      id: 1,
      name: "Elite Travel Package",
      description: "First-class flights to any destination worldwide",
      price: 4999,
      originalPrice: 7142,
      discount: 30,
      category: "Travel",
      icon: Plane,
      featured: true
    },
    {
      id: 2,
      name: "Premium Cloud Hosting",
      description: "Enterprise-grade hosting with 99.99% uptime",
      price: 349,
      originalPrice: 499,
      discount: 30,
      category: "Hosting",
      icon: Server,
      featured: true
    },
    {
      id: 3,
      name: "Master Class Bundle",
      description: "Access to exclusive courses by industry leaders",
      price: 699,
      originalPrice: 999,
      discount: 30,
      category: "Education",
      icon: GraduationCap,
      featured: false
    },
    {
      id: 4,
      name: "VIP Networking Event",
      description: "Annual summit with elite investors and entrepreneurs",
      price: 1999,
      originalPrice: 2856,
      discount: 30,
      category: "Events",
      icon: Star,
      featured: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-[hsl(38,92%,50%)] bg-clip-text text-transparent">
                  Baalvion
                </span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-1">
                <Button variant="ghost" asChild>
                  <Link to="/dashboard">Feed</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/forums">Forums</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/marketplace">Marketplace</Link>
                </Button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search products..." 
                  className="pl-10 w-64 bg-secondary border-border"
                />
              </div>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="premium" asChild>
                <Link to="/profile">Profile</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-[hsl(38,92%,50%)] to-primary p-12 text-center shadow-[var(--shadow-elevated)]">
            <div className="relative z-10">
              <Badge className="mb-4 bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                Exclusive Member Pricing
              </Badge>
              <h1 className="text-5xl font-bold mb-4 text-primary-foreground">
                Insider Deals Marketplace
              </h1>
              <p className="text-xl text-primary-foreground/90 mb-6 max-w-2xl mx-auto">
                Access premium products and services at 30% off. Elite members only.
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="secondary" size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Browse All Deals
                </Button>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-3 flex-wrap">
            {["All", "Travel", "Hosting", "Education", "Events", "Services"].map((cat) => (
              <Button
                key={cat}
                variant={cat === "All" ? "default" : "outline"}
                size="sm"
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const Icon = product.icon;
              return (
                <Card 
                  key={product.id} 
                  className={`bg-gradient-to-br from-card to-card/80 border-border hover:shadow-[var(--shadow-elevated)] transition-all duration-300 group cursor-pointer ${
                    product.featured ? 'ring-2 ring-primary/30' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      {product.featured && (
                        <Badge variant="default" className="bg-primary text-primary-foreground">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {product.name}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-primary/20 text-primary">
                          <Tag className="w-3 h-3 mr-1" />
                          {product.discount}% OFF
                        </Badge>
                        <Badge variant="secondary">{product.category}</Badge>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary">
                          ${product.price}
                        </span>
                        <span className="text-lg text-muted-foreground line-through">
                          ${product.originalPrice}
                        </span>
                      </div>
                      <Button variant="premium" className="w-full">
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Get Deal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Info Section */}
          <Card className="bg-gradient-to-br from-card to-card/80 border-primary/30 mt-12">
            <CardContent className="p-8">
              <div className="text-center max-w-3xl mx-auto">
                <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-3">Elite Member Benefits</h3>
                <p className="text-muted-foreground mb-6">
                  All deals include 30% insider pricing, priority support, and exclusive access to limited-time offers. 
                  Earn loyalty points with every purchase.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  <div>
                    <div className="text-primary font-bold text-lg mb-1">30% OFF</div>
                    <div className="text-sm text-muted-foreground">On all products</div>
                  </div>
                  <div>
                    <div className="text-primary font-bold text-lg mb-1">24/7 Support</div>
                    <div className="text-sm text-muted-foreground">Priority assistance</div>
                  </div>
                  <div>
                    <div className="text-primary font-bold text-lg mb-1">Loyalty Points</div>
                    <div className="text-sm text-muted-foreground">Earn with purchases</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
