import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star, Heart, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    discountPrice?: number;
    category: string;
    rating: number;
    reviewsCount: number;
    imageUrl?: string;
    loyaltyPointsRequired?: number;
    isFeatured?: boolean;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { toast } = useToast();

  const discount = product.discountPrice 
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to cart",
        variant: "destructive",
      });
      return;
    }

    // Here you would implement cart logic
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    });
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      duration: 2000,
    });
  };

  return (
    <Card className="bg-gradient-to-br from-card to-card/80 border-border hover:shadow-[var(--shadow-elevated)] transition-all duration-300 group overflow-hidden">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-secondary/50 overflow-hidden">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isFeatured && (
            <Badge variant="default" className="bg-primary text-primary-foreground">
              Featured
            </Badge>
          )}
          {discount > 0 && (
            <Badge variant="destructive" className="bg-gradient-to-r from-primary to-[hsl(38,92%,50%)] text-primary-foreground">
              {discount}% OFF
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-3 right-3 rounded-full"
          onClick={handleWishlist}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-primary text-primary' : ''}`} />
        </Button>
      </div>

      {/* Content */}
      <CardHeader className="pb-3">
        <Badge variant="secondary" className="w-fit mb-2">
          {product.category}
        </Badge>
        <Link to={`/marketplace/product/${product.id}`}>
          <CardTitle className="text-xl hover:text-primary transition-colors cursor-pointer line-clamp-2">
            {product.name}
          </CardTitle>
        </Link>
        <CardDescription className="line-clamp-2">
          {product.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="font-medium">{product.rating.toFixed(1)}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            ({product.reviewsCount} reviews)
          </span>
        </div>

        {/* Price */}
        <div className="flex items-end gap-3">
          {product.discountPrice ? (
            <>
              <span className="text-2xl font-bold text-primary">
                ${product.discountPrice.toFixed(2)}
              </span>
              <span className="text-lg text-muted-foreground line-through">
                ${product.price.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-2xl font-bold text-primary">
              ${product.price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Loyalty Points */}
        {product.loyaltyPointsRequired && product.loyaltyPointsRequired > 0 && (
          <div className="text-sm text-muted-foreground">
            Or redeem with {product.loyaltyPointsRequired.toLocaleString()} loyalty points
          </div>
        )}

        {/* Action Button */}
        <Button 
          variant="premium" 
          className="w-full"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
}
