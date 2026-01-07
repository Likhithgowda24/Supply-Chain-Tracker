import { Package, Truck, Users, CheckCircle, ShoppingCart, Search } from "lucide-react";
import { QuickStatsCard } from "@/components/QuickStatsCard";
import { ShipmentCard } from "@/components/ShipmentCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ProductCard } from "@/components/ProductCard";
import { OrderDetailsDialog } from "@/components/OrderDetailsDialog";
import { ShipmentDetailsDialog } from "@/components/ShipmentDetailsDialog";
import { ActivityDetailsDialog } from "@/components/ActivityDetailsDialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import type { Order } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [shipmentDialogOpen, setShipmentDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeInOut",
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const userRole = localStorage.getItem("role")?.toLowerCase() || "customer";
  const isCustomer = userRole === "customer";

  const { data: customerMetrics, isError: metricsError } = useQuery<{
    ordersPlaced: number;
    inTransit: number;
    shipped: number;
    delivered: number;
  }>({
    queryKey: ["/api/dashboard/metrics"],
    enabled: isCustomer,
    retry: false,
    refetchInterval: 5000,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: isCustomer,
    refetchInterval: 5000,
  });

  // Fetch products from database
  const { data: dbProducts = [] } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json().then((data: any[]) =>
        data
          .filter((p: any) => p.image)
          .map((p: any) => ({
            id: p.productId,
            name: p.name,
            price: typeof p.price === 'number' ? p.price : parseFloat(String(p.price) || '0'),
            category: p.category || "General",
            stock: typeof p.stock === 'number' ? p.stock : parseInt(String(p.stock) || '0'),
            image: p.image,
            productId: p.productId,
            description: p.description,
          }))
      );
    },
  });


  // Calculate filtered orders count (only orders with products that have images)
  const filteredOrders = orders.filter((order) =>
    dbProducts.some((product) => product.productId === order.productId)
  );

  const stats = isCustomer
    ? [
      {
        title: "Orders Placed",
        value: filteredOrders.length.toString(),
        icon: ShoppingCart,
        trend: { value: 0, isPositive: true },
        onClick: () => {
          if (orders.length > 0) {
            setSelectedOrder(orders[0]);
            setOrderDialogOpen(true);
          }
        }
      },
      {
        title: "In Transit",
        value: (orders.filter((o: Order) => o.status === "in-transit" || o.status === "confirmed").length).toString(),
        icon: Truck,
        trend: { value: 0, isPositive: true },
        onClick: () => {
          const inTransitOrder = orders.find((o: Order) => o.status === "in-transit" || o.status === "confirmed");
          if (inTransitOrder) {
            setSelectedOrder(inTransitOrder);
            setOrderDialogOpen(true);
          }
        }
      },
      {
        title: "Shipped",
        value: customerMetrics?.shipped?.toString() || "0",
        icon: Package,
        trend: { value: 0, isPositive: true },
        onClick: () => {
          const shippedOrder = orders.find((o: Order) => o.status === "shipped");
          if (shippedOrder) {
            setSelectedOrder(shippedOrder);
            setOrderDialogOpen(true);
          }
        }
      },
      {
        title: "Delivered",
        value: customerMetrics?.delivered?.toString() || "0",
        icon: CheckCircle,
        trend: { value: 0, isPositive: true },
        onClick: () => {
          const deliveredOrder = orders.find((o: Order) => o.status === "delivered");
          if (deliveredOrder) {
            setSelectedOrder(deliveredOrder);
            setOrderDialogOpen(true);
          }
        }
      },
    ]
    : [
      { title: "Active Products", value: "2,847", icon: Package, trend: { value: 12.5, isPositive: true } },
      { title: "In Transit", value: "1,243", icon: Truck, trend: { value: 8.2, isPositive: true } },
      { title: "Total Customers", value: "8,924", icon: Users, trend: { value: 3.1, isPositive: false } },
      { title: "Delivered", value: "15,672", icon: CheckCircle, trend: { value: 15.3, isPositive: true } },
    ];

  // Generate activities from real orders and shipments
  const generateActivities = () => {
    const acts: any[] = [];

    // Add order placed activities from recent orders
    if (orders && orders.length > 0) {
      orders.slice(0, 3).forEach((order, index) => {
        const createdAt = new Date(order.createdAt || new Date());
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        let timeStr = diffMins < 60 ? `${diffMins} min ago` : `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

        acts.push({
          id: `order-${order.id}`,
          type: "order" as const,
          title: "New Order Placed",
          description: `Order ${order.orderId} - Qty: ${order.quantity}`,
          timestamp: timeStr,
          order: order,
        });
      });
    }

    // Add shipment in transit activities
    if (orders && orders.length > 0) {
      const transitOrders = orders.filter((o: Order) => o.status === "in-transit" || o.status === "confirmed" || o.status === "shipped");
      transitOrders.slice(0, 2).forEach((order) => {
        acts.push({
          id: `shipment-${order.id}`,
          type: "shipment" as const,
          title: "Shipment in Transit",
          description: `Order ${order.orderId} is on the way to ${(order.shippingAddress as any)?.city || 'destination'}`,
          timestamp: "In Progress",
          order: order,
        });
      });
    }

    return acts.length > 0 ? acts : [
      {
        id: "1",
        type: "order" as const,
        title: "New Order Placed",
        description: "No orders yet",
        timestamp: "N/A",
      },
      {
        id: "2",
        type: "shipment" as const,
        title: "Shipment in Transit",
        description: "No shipments in transit",
        timestamp: "N/A",
      },
    ];
  };

  const activities = generateActivities();

  // Generate Recent Shipments from real orders
  const generateRecentShipments = () => {
    if (!orders || orders.length === 0) {
      return [];
    }

    return orders
      .filter((order: Order) =>
        order.status === "in-transit" || order.status === "confirmed" || order.status === "shipped" || order.status === "delivered"
      )
      .slice(0, 4)
      .map((order: Order) => {
        let shipmentStatus: "in-transit" | "delivered" | "shipped" = "in-transit";
        let currentLocation = "Distribution Center";

        if (order.status === "delivered") {
          shipmentStatus = "delivered";
          currentLocation = "Delivery Hub";
        } else if (order.status === "shipped") {
          shipmentStatus = "shipped";
          currentLocation = "Sorting Center";
        } else if (order.status === "in-transit" || order.status === "confirmed") {
          shipmentStatus = "in-transit";
          currentLocation = order.status === "in-transit" ? "In Transit Hub" : "Distribution Center";
        }

        // Calculate estimated delivery (mock: 3-5 days from order)
        const orderDate = new Date(order.createdAt || new Date());
        const estimatedDate = new Date(orderDate.getTime() + (3 + Math.random() * 2) * 24 * 60 * 60 * 1000);
        const estimatedDelivery = estimatedDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        return {
          shipmentId: order.orderId,
          productName: `Order ${order.orderId}`,
          status: shipmentStatus,
          currentLocation: `${currentLocation} - ${currentLocation === "Delivery Hub" ? "Ready for delivery" : "In transit"}`,
          destination: `${(order.shippingAddress as any)?.city || 'Destination'}, ${(order.shippingAddress as any)?.state || ''}`,
          estimatedDelivery: order.status === "delivered" ? "Delivered" : estimatedDelivery,
        };
      });
  };

  const recentShipments = generateRecentShipments();

  const shopProducts = dbProducts;

  const filteredProducts = shopProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your supply chain overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <QuickStatsCard
            key={stat.title}
            {...stat}
            onClick={'onClick' in stat ? stat.onClick : () => console.log(`${stat.title} clicked`)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Recent Shipments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentShipments.map((shipment) => (
                <ShipmentCard
                  key={shipment.shipmentId}
                  {...shipment}
                  onClick={() => {
                    setSelectedShipment(shipment);
                    setShipmentDialogOpen(true);
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Shop List</h2>
            </div>
            <div className="relative mb-4 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by product ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-dashboard-search-products"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  onOrder={(id, qty) => setLocation(`/loading?redirect=${encodeURIComponent(`/shop?scroll=${id}`)}`)}
                  onWishlist={(id) => {
                    const token = localStorage.getItem("accessToken");
                    if (!token) {
                      window.location.href = "/login";
                      return;
                    }
                    fetch(`/api/wishlist`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ productId: id }),
                    }).then(() => window.location.reload());
                  }}
                />
              ))}
            </div>
            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No products found matching your search</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <ActivityFeed
            activities={activities}
            onActivityClick={(id) => {
              const activity = activities.find((a) => a.id === id);
              if (activity) {
                setSelectedActivity(activity);
                setActivityDialogOpen(true);
                // If activity has an order, select it for dialog display
                if ((activity as any)?.order) {
                  setSelectedOrder((activity as any).order);
                }
              }
            }}
          />
        </div>
      </div>

      <OrderDetailsDialog
        order={selectedOrder}
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
      />

      <ShipmentDetailsDialog
        shipment={selectedShipment}
        open={shipmentDialogOpen}
        onOpenChange={setShipmentDialogOpen}
      />

      <ActivityDetailsDialog
        activity={selectedActivity}
        open={activityDialogOpen}
        onOpenChange={setActivityDialogOpen}
      />
    </motion.div>
  );
}
