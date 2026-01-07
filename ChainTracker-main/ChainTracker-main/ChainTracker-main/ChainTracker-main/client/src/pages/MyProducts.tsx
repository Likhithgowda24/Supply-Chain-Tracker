import { ArrowLeft, Trash2, Edit2, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  productId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string | null;
  manufacturerId: string;
}

interface Order {
  id: string;
  orderId: string;
  productId: string;
  userId: string;
  quantity: number;
  totalPrice: string;
  status: string;
  createdAt: string;
  shippingAddress?: any;
}

export default function MyProducts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const manufacturerId = localStorage.getItem("userId");

  const { data: products = [], isLoading, refetch } = useQuery<Product[]>({
    queryKey: ["/api/products", manufacturerId],
    queryFn: async () => {
      const response = await fetch(`/api/products?manufacturerId=${manufacturerId}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      return data.map((product: any) => ({
        ...product,
        price: typeof product.price === 'number' ? product.price : parseFloat(String(product.price) || '0'),
        stock: typeof product.stock === 'number' ? product.stock : parseInt(String(product.stock) || '0'),
      }));
    },
  });

  // Fetch all orders
  const { data: allOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const response = await fetch("/api/orders", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
  });

  // Fetch all users
  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Filter orders for manufacturer's products
  const customerOrders = allOrders.filter((order) =>
    products.some((product) => product.productId === order.productId)
  );

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
        refetch();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete product",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the product",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold glowing-text">My Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your product inventory</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No products yet</p>
          <Button onClick={() => setLocation("/add-product")} data-testid="button-add-first-product">
            Add Your First Product
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="menu-zoom-glow"
            >
              <Card className="p-6 hover-elevate transition-all">
                <div className="flex items-start justify-between gap-4">
                  {product.image && (
                    <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        data-testid={`img-product-${product.id}`}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2" data-testid={`text-product-name-${product.id}`}>
                      {product.name}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="font-semibold" data-testid={`text-product-price-${product.id}`}>${typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(String(product.price)).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Stock</p>
                        <p className={`font-semibold ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`} data-testid={`text-product-stock-${product.id}`}>
                          {product.stock} units
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Product ID</p>
                        <p className="font-mono text-sm" data-testid={`text-product-id-${product.id}`}>{product.productId}</p>
                      </div>
                    </div>
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-product-description-${product.id}`}>
                        {product.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setLocation(`/edit-product/${product.id}`)}
                      data-testid={`button-edit-product-${product.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                      data-testid={`button-delete-product-${product.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Button
        onClick={() => setLocation("/add-product")}
        size="lg"
        data-testid="button-add-product-fab"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add New Product
      </Button>

      {/* Customer Orders Section */}
      {customerOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-12 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h2 className="text-2xl font-bold">Customer Orders</h2>
            <Badge className="bg-primary text-primary-foreground">{customerOrders.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Customers who ordered your products</p>

          <div className="grid gap-4">
            {customerOrders.map((order, index) => {
              const customer = allUsers.find((u: any) => u.id === order.userId);
              const product = products.find((p) => p.productId === order.productId);
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="p-4 hover-elevate transition-all">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Customer Info */}
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Customer Name</p>
                        <p className="font-medium" data-testid={`text-customer-name-${order.id}`}>
                          {customer?.username || customer?.name || "Unknown Customer"}
                        </p>
                        <p className="text-xs text-muted-foreground">{customer?.email || "No email"}</p>
                      </div>

                      {/* Product Info */}
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Product Ordered</p>
                        <p className="font-medium" data-testid={`text-ordered-product-${order.id}`}>
                          {product?.name || "Unknown Product"}
                        </p>
                        <p className="text-xs text-muted-foreground">Qty: {order.quantity}</p>
                      </div>

                      {/* Order Details */}
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Order Date & Amount</p>
                        <p className="font-medium" data-testid={`text-order-date-${order.id}`}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs font-semibold text-primary">
                          ₹{parseFloat(order.totalPrice).toLocaleString()}
                        </p>
                      </div>

                      {/* Status */}
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Order Status</p>
                        <div className="flex items-center gap-2">
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === "delivered"
                                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                : order.status === "shipped"
                                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                : order.status === "cancelled"
                                ? "bg-red-500/10 text-red-700 dark:text-red-400"
                                : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                            }`}
                            data-testid={`text-order-status-${order.id}`}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    {order.shippingAddress && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground font-semibold mb-2">Shipping Address</p>
                        <p className="text-sm" data-testid={`text-address-street-${order.id}`}>
                          {order.shippingAddress.street}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zipCode}
                        </p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
