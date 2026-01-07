import { ProductCard } from "@/components/ProductCard";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AddressDialog, type AddressData } from "@/components/AddressDialog";

export default function Shop() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Check if user is logged in
  const accessToken = localStorage.getItem("accessToken");
  const isLoggedIn = !!accessToken;
  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("role")?.toLowerCase() || "customer";

  // Address dialog state
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{ productId: string; quantity: number } | null>(null);

  // Product detail modal state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch all products from database
  const { data: dbProducts = [], isLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products", {
        headers: isLoggedIn ? { "Authorization": `Bearer ${accessToken}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json().then((data: any[]) =>
        data.map((p: any) => ({
          id: p.productId,
          name: p.name,
          price: typeof p.price === 'number' ? p.price : parseFloat(String(p.price) || '0'),
          category: p.category || "General",
          stock: typeof p.stock === 'number' ? p.stock : parseInt(String(p.stock) || '0'),
          image: p.image,
          productId: p.productId,
          description: p.description,
          manufacturerId: p.manufacturerId,
        }))
      );
    },
  });

  // Filter products: manufacturers see only their own products, customers see all
  const products = (dbProducts.length > 0
    ? userRole === "manufacturer"
      ? dbProducts.filter((p: any) => p.manufacturerId === userId && p.image)
      : dbProducts.filter((p: any) => p.image)
    : []);

  const filteredProducts = products.filter((p) =>
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())) &&
    p.image
  );

  // Check for scroll/search parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scrollProductId = params.get("scroll");
    const searchParam = params.get("search");

    if (searchParam) {
      setSearchQuery(searchParam);
    }

    if (scrollProductId) {
      const product = products.find((p) => p.id === scrollProductId);
      if (product) {
        setSelectedProduct(product);
        setModalOpen(true);
      }
    }
  }, [products]); // Re-run when products load

  // Order mutation
  const orderMutation = useMutation({
    mutationFn: async ({ productId, quantity, address }: { productId: string; quantity: number; address: AddressData }) => {
      return await apiRequest("POST", "/api/orders", {
        productId,
        quantity,
        shippingAddress: {
          street: address.building,
          city: address.city,
          state: address.state,
          zipCode: address.pinCode,
          country: address.country,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setAddressDialogOpen(false);
      setPendingOrder(null);
      toast({
        title: "Order Placed Successfully!",
        description: "Your order has been placed and will be processed soon.",
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

  // Wishlist mutation
  const wishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("POST", "/api/wishlist", { productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Added to Wishlist",
        description: "Product has been added to your wishlist!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to wishlist",
        variant: "destructive",
      });
    },
  });

  const handleOrder = (productId: string, quantity: number) => {
    // Check if user is logged in
    if (!isLoggedIn) {
      toast({
        title: "Login Required",
        description: "Please login to place an order",
        variant: "destructive",
      });
      return;
    }
    // Store pending order and open address dialog
    setPendingOrder({ productId, quantity });
    setAddressDialogOpen(true);
  };

  const handleAddressSubmit = (address: AddressData) => {
    if (pendingOrder) {
      orderMutation.mutate({
        ...pendingOrder,
        address,
      });
    }
  };

  const handleWishlist = (productId: string) => {
    // Check if user is logged in
    if (!isLoggedIn) {
      toast({
        title: "Login Required",
        description: "Please login to add products to your wishlist",
        variant: "destructive",
      });
      return;
    }
    wishlistMutation.mutate(productId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-4xl font-bold mb-2">Shop</h1>
        <p className="text-muted-foreground">Browse and order premium products from our inventory</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-products"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                onOrder={handleOrder}
                onWishlist={handleWishlist}
              />
            ))
          ) : (
            <div className="text-center py-12 col-span-full">
              <p className="text-muted-foreground">No products found</p>
            </div>
          )}
        </div>
      )}

      <AddressDialog
        open={addressDialogOpen}
        onOpenChange={setAddressDialogOpen}
        onSubmit={handleAddressSubmit}
        isSubmitting={orderMutation.isPending}
      />

      <ProductDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        product={selectedProduct}
        onOrder={handleOrder}
        onWishlist={handleWishlist}
      />
    </motion.div>
  );
}
