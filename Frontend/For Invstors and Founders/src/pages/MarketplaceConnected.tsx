import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ShoppingBag, Zap, Star, Tag } from "lucide-react";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price: number | null;
  category: string;
  image_url: string | null;
  stock_quantity: number;
  is_featured: boolean;
};

export default function MarketplaceConnected() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products' as any)
        .select('*')
        .gt('stock_quantity', 0)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts((data as any) || []);
    } catch (error: any) {
      console.error("Failed to load products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (productId: string) => {
    if (!user) {
      toast.error("Please sign in to purchase");
      navigate("/auth");
      return;
    }

    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const { error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity: 1,
          total_amount: product.discount_price || product.price,
          status: 'pending'
        });

      if (error) throw error;

      toast.success("Order placed successfully! Check your email for details.");
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast.error("Failed to place order");
    }
  };

  const categories = ["all", "flights", "hosting", "courses", "merchandise", "vip_deals"];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-[hsl(38,92%,50%)] to-primary p-12 text-center shadow-[var(--shadow-elevated)] mb-8">
          <div className="relative z-10">
            <Badge className="mb-4 bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
              Exclusive Member Pricing
            </Badge>
            <h1 className="text-5xl font-bold mb-4 text-primary-foreground">
              Insider Deals Marketplace
            </h1>
            <p className="text-xl text-primary-foreground/90 mb-6 max-w-2xl mx-auto">
              Access premium products and services at exclusive prices. Elite members only.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-12 h-12 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div className="flex gap-3 flex-wrap mb-8">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={cat === selectedCategory ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card
                key={product.id}
                className="bg-gradient-to-br from-card to-card/80 border-border overflow-hidden hover:shadow-[var(--shadow-elevated)] hover:border-primary/40 transition-all duration-300 group cursor-pointer"
              >
                <div className="relative h-44 overflow-hidden bg-secondary">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-10 h-10 text-primary/40" /></div>
                  )}
                  <Badge variant="secondary" className="absolute top-3 left-3 capitalize backdrop-blur bg-background/70">{product.category.replace("_", " ")}</Badge>
                  {product.is_featured && (
                    <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground"><Star className="w-3 h-3 mr-1" />Featured</Badge>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {product.name}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground line-clamp-2">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {product.discount_price && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-primary/20 text-primary">
                          <Tag className="w-3 h-3 mr-1" />
                          {Math.round((1 - product.discount_price / product.price) * 100)}% OFF
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">
                        ${product.discount_price || product.price}
                      </span>
                      {product.discount_price && (
                        <span className="text-lg text-muted-foreground line-through">
                          ${product.price}
                        </span>
                      )}
                    </div>
                    <Button 
                      variant="premium" 
                      className="w-full"
                      onClick={() => handlePurchase(product.id)}
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Get Deal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
