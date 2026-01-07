import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Trash2, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Wishlist, Product } from "@shared/schema";
import { ProductDetailModal } from "@/components/ProductDetailModal";

export default function WishlistPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Product detail modal state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Check if user is logged in
  const accessToken = localStorage.getItem("accessToken");
  const isLoggedIn = !!accessToken;

  const { data: wishlistItems = [], isLoading, error } = useQuery<Wishlist[]>({
    queryKey: ["/api/wishlist"],
    enabled: isLoggedIn,
    retry: false,
  });

  // Fetch products from backend
  const { data: backendProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    retry: false,
  });

  // Use only backend products (no mock data)
  const allProducts = backendProducts;

  // Order mutation from wishlist
  const orderMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      return await apiRequest("POST", "/api/orders", {
        productId,
        quantity,
        shippingAddress: {
          street: "Default Street",
          city: "Default City",
          state: "Default State",
          zipCode: "000000",
          country: "Default Country",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setModalOpen(false);
      setSelectedProduct(null);
      toast({
        title: "Order Placed Successfully!",
        description: "Your order has been placed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("DELETE", `/api/wishlist/${productId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Removed from wishlist",
        description: "Product has been removed from your wishlist",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove product from wishlist",
        variant: "destructive",
      });
    },
  });

  const handleOrder = (productId: string, quantity: number) => {
    orderMutation.mutate({ productId, quantity });
  };

  // Match wishlist items with products using product_id field
  const wishlistProducts = allProducts.filter((product) =>
    wishlistItems.some((item) => item.productId === product.productId)
  );

  // Show login prompt if not authenticated
  if (!isLoggedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Heart className="h-10 w-10 text-primary fill-primary" />
            My Wishlist
          </h1>
          <p className="text-muted-foreground">
            Products you've saved for later
          </p>
        </div>

        <Card className="p-12 text-center">
          <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Please login to view your wishlist</h3>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to save and view your favorite products
          </p>
          <Button asChild data-testid="button-login">
            <a href="/login">
              Login to Continue
            </a>
          </Button>
        </Card>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Heart className="h-10 w-10 text-primary fill-primary" />
          My Wishlist
        </h1>
        <p className="text-muted-foreground">
          Products you've saved for later
        </p>
      </div>

      {wishlistProducts.length === 0 ? (
        <Card className="p-12 text-center">
          <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
          <p className="text-muted-foreground mb-6">
            Save products you love to your wishlist
          </p>
          <Button asChild>
            <a href="/shop">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Browse Products
            </a>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden hover-elevate cursor-pointer"
              data-testid={`card-wishlist-${product.id}`}
              onClick={() => {
                setSelectedProduct(product);
                setModalOpen(true);
              }}
            >
              <div className="relative h-48 bg-muted">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWishlistMutation.mutate(product.productId);
                  }}
                  data-testid={`button-remove-wishlist-${product.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <Badge variant="secondary" className="ml-2">
                      ₹{product.price}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(product);
                      setModalOpen(true);
                    }}
                    data-testid={`button-order-wishlist-${product.id}`}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Order Now
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ProductDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        product={selectedProduct}
        onOrder={handleOrder}
      />

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {wishlistProducts.length} {wishlistProducts.length === 1 ? "item" : "items"} in your wishlist
        </p>
      </div>
    </motion.div>
  );
}
