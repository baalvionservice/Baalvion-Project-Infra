import { useState, useEffect } from "react";
import { MessageSquare, FileText, Sparkles, Bot, ShoppingCart, Check, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProtocolLayout from "@/components/protocol/ProtocolLayout";
import { protocolApi } from "@/lib/protocol-api";
import { toast } from "sonner";

const mockProducts = [
  {
    id: 1,
    type: "message",
    title: "Weekly Insider Tips",
    description: "Get exclusive market insights delivered weekly",
    price: 9.99,
    originalPrice: 19.99,
    icon: MessageSquare,
    color: "amber",
    sales: 145,
    featured: true
  },
  {
    id: 2,
    type: "document",
    title: "Complete Trading Guide",
    description: "200+ pages of comprehensive trading strategies",
    price: 49.99,
    originalPrice: 99.99,
    icon: FileText,
    color: "blue",
    sales: 89,
    featured: true
  },
  {
    id: 3,
    type: "prompt",
    title: "Market Analysis Template",
    description: "Professional templates for technical analysis",
    price: 14.99,
    originalPrice: null,
    icon: Sparkles,
    color: "purple",
    sales: 234,
    featured: false
  },
  {
    id: 4,
    type: "ai",
    title: "AI Trading Assistant",
    description: "Personalized AI-powered trading recommendations",
    price: 29.99,
    originalPrice: 59.99,
    icon: Bot,
    color: "green",
    sales: 67,
    featured: true
  },
  {
    id: 5,
    type: "document",
    title: "Risk Management Playbook",
    description: "Essential guide to protecting your portfolio",
    price: 24.99,
    originalPrice: null,
    icon: FileText,
    color: "blue",
    sales: 156,
    featured: false
  },
  {
    id: 6,
    type: "message",
    title: "Daily Market Brief",
    description: "Start your trading day informed",
    price: 4.99,
    originalPrice: null,
    icon: MessageSquare,
    color: "amber",
    sales: 312,
    featured: false
  },
];

const ICON_BY_TYPE: Record<string, any> = { message: MessageSquare, document: FileText, prompt: Sparkles, ai: Bot };
const COLOR_BY_TYPE: Record<string, string> = { message: "amber", document: "blue", prompt: "purple", ai: "green" };

const StudentStore = () => {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    protocolApi.products.list().then((rows) => setProducts(rows.map((p: any) => ({ ...p, icon: ICON_BY_TYPE[p.type] || MessageSquare, color: COLOR_BY_TYPE[p.type] || "amber" }))));
  }, []);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [cart, setCart] = useState<any[]>([]);

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
      blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
      purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" },
      green: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" },
    };
    return colors[color] || colors.amber;
  };

  const handleBuy = (product: any) => {
    setSelectedProduct(product);
    setShowCheckoutModal(true);
  };

  const handleCheckout = async () => {
    if (selectedProduct) await protocolApi.orders.create({ product_id: selectedProduct.id, amount: selectedProduct.price });
    setShowCheckoutModal(false);
    setShowSuccessModal(true);
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setSelectedProduct(null);
    toast.success("Purchase completed successfully!");
  };

  return (
    <ProtocolLayout
      role="student"
      breadcrumbs={[
        { label: "Student Dashboard", href: "/protocol/student" },
        { label: "Store", href: "/protocol/student/store" }
      ]}
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-light tracking-wide text-white mb-2">Premium Store</h1>
          <p className="text-white/50">Unlock exclusive content and resources</p>
        </div>

        {/* Featured Products */}
        <div>
          <h2 className="text-xl font-light text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Featured
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.filter(p => p.featured).map((product) => {
              const colors = getColorClasses(product.color);
              return (
                <Card 
                  key={product.id}
                  className={`${colors.bg} ${colors.border} border hover:scale-105 transition-all duration-300 relative overflow-hidden`}
                >
                  {product.originalPrice && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                      SALE
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}>
                      <product.icon className={`w-7 h-7 ${colors.text}`} />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">{product.title}</h3>
                    <p className="text-white/50 text-sm mb-4">{product.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div>
                        <span className={`text-xl font-semibold ${colors.text}`}>${product.price}</span>
                        {product.originalPrice && (
                          <span className="ml-2 text-white/40 line-through text-sm">${product.originalPrice}</span>
                        )}
                      </div>
                      <Button 
                        onClick={() => handleBuy(product)}
                        className={`${colors.bg} ${colors.text} hover:opacity-80 border ${colors.border}`}
                      >
                        Buy Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* All Products */}
        <div>
          <h2 className="text-xl font-light text-white mb-4">All Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.filter(p => !p.featured).map((product) => {
              const colors = getColorClasses(product.color);
              return (
                <Card 
                  key={product.id}
                  className="bg-white/5 border-amber-500/10 hover:border-amber-500/30 transition-all"
                >
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center mb-4`}>
                      <product.icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">{product.title}</h3>
                    <p className="text-white/50 text-sm mb-4">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-semibold text-amber-400">${product.price}</span>
                      <Button 
                        onClick={() => handleBuy(product)}
                        variant="outline"
                        className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10"
                      >
                        Buy Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="bg-[#0a0a0f] border-amber-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-500" />
              Checkout
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6 py-4">
              {/* Product Summary */}
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${getColorClasses(selectedProduct.color).bg} rounded-lg flex items-center justify-center`}>
                    <selectedProduct.icon className={`w-6 h-6 ${getColorClasses(selectedProduct.color).text}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{selectedProduct.title}</p>
                    <p className="text-white/50 text-sm">{selectedProduct.description}</p>
                  </div>
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t border-white/10">
                  <span className="text-white/70">Total</span>
                  <span className="text-xl font-semibold text-amber-400">${selectedProduct.price}</span>
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-4">
                <div>
                  <Label className="text-white/70">Card Number</Label>
                  <Input 
                    placeholder="4242 4242 4242 4242"
                    className="bg-white/5 border-amber-500/20 text-white mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/70">Expiry</Label>
                    <Input 
                      placeholder="MM/YY"
                      className="bg-white/5 border-amber-500/20 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-white/70">CVC</Label>
                    <Input 
                      placeholder="123"
                      className="bg-white/5 border-amber-500/20 text-white mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckoutModal(false)} className="border-amber-500/20 text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleCheckout} className="bg-amber-500 text-black hover:bg-amber-400">
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ${selectedProduct?.price}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-[#0a0a0f] border-amber-500/20 text-white max-w-sm">
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-light text-white mb-2">Purchase Complete!</h2>
            <p className="text-white/50 mb-6">
              You now have access to "{selectedProduct?.title}"
            </p>
            <Button onClick={handleCloseSuccess} className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30">
              Access Content
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ProtocolLayout>
  );
};

export default StudentStore;
