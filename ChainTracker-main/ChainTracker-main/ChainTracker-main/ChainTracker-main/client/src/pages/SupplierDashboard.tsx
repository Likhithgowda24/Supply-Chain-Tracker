import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Package, Truck, Users, TrendingUp, Factory, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { QuickStatsCard } from "@/components/QuickStatsCard";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SupplierStats {
  totalInventory: number;
  lowStockItems: number;
  activeManufacturers: number;
  pendingOrders: number;
  completedDeliveries: number;
  topProducts: Array<{ name: string; units: number }>;
  topManufacturers: Array<{ name: string; orders: number }>;
}

interface AssignedOrder {
  orderId: string;
  productName: string;
  customerName: string;
  quantity: number;
  totalPrice: number;
  status: string;
  manufacturerName: string;
  assignedAt: string;
}

export default function SupplierDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("POST", `/api/supplier/accept-order/${orderId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/assigned-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/stats"] });
      toast({
        title: "Order Accepted",
        description: "The order has been added to your active orders.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to accept order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const declineOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("POST", `/api/supplier/decline-order/${orderId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/assigned-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/stats"] });
      toast({
        title: "Order Declined",
        description: "The order has been removed from your list.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to decline order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch live stats with aggressive polling for real-time updates
  const { data: liveStats, isLoading: statsLoading } = useQuery<SupplierStats>({
    queryKey: ["/api/supplier/stats"],
    refetchInterval: 2000,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
    enabled: true,
  });

  // Fetch assigned orders for supplier
  const { data: assignedOrders = [] } = useQuery<AssignedOrder[]>({
    queryKey: ["/api/supplier/assigned-orders"],
    refetchInterval: 2000,
    staleTime: 0,
    gcTime: 0,
  });

  // Get unique manufacturers from assigned orders
  const uniqueManufacturers = Array.from(
    new Map(assignedOrders.map(order => [order.manufacturerName, order])).values()
  );

  const getDisplayStatus = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "shipped") return "shipped";
    if (statusLower === "delivered") return "delivered";
    if (statusLower === "cancelled") return "cancelled";
    if (statusLower === "placed" || statusLower === "pending_acceptance") return "pending";
    return "accepted";
  };

  // Get pending orders (placed status or pending_acceptance)
  const pendingOrdersData = assignedOrders.filter(o => o.status === "placed" || o.status === "pending_acceptance");

  // Get active assigned orders (accepted, in-transit, etc, but NOT placed/pending)
  const activeAssignedOrders = assignedOrders.filter(o => o.status !== "placed" && o.status !== "pending_acceptance");

  // Get completed deliveries (delivered status only)
  const completedDeliveries = assignedOrders.filter(o => o.status === "delivered" || o.status === "shipped");

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
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Page Title */}
      <motion.div variants={itemVariants} className="space-y-1">
        <h1 className="text-3xl font-bold glowing-text">Supplier Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Manage your inventory, track orders, and monitor supply chain metrics
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div variants={itemVariants} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search products, manufacturers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 zoom-pop text-sm h-9"
            data-testid="input-search"
          />
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={itemVariants}>
          <QuickStatsCard
            title="Total Inventory"
            value={liveStats?.totalInventory || 0}
            icon={Package}
            trend={{ value: 5, isPositive: true }}
            onClick={() => setOpenDialog("inventory")}
            data-testid="card-total-inventory"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <QuickStatsCard
            title="Assigned Orders"
            value={activeAssignedOrders.length}
            icon={Truck}
            trend={{ value: 0, isPositive: true }}
            onClick={() => setOpenDialog("assigned")}
            data-testid="card-assigned-orders"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <QuickStatsCard
            title="Active Manufacturers"
            value={liveStats?.activeManufacturers || 0}
            icon={Users}
            trend={{ value: 3, isPositive: true }}
            onClick={() => setOpenDialog("manufacturers")}
            data-testid="card-active-manufacturers"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <QuickStatsCard
            title="Pending Orders"
            value={liveStats?.pendingOrders || 0}
            icon={TrendingUp}
            trend={{ value: 2, isPositive: true }}
            onClick={() => setOpenDialog("pending")}
            data-testid="card-pending-orders"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <QuickStatsCard
            title="Completed Shipped"
            value={liveStats?.completedDeliveries || 0}
            icon={Package}
            trend={{ value: 12, isPositive: true }}
            onClick={() => setOpenDialog("completed")}
            data-testid="card-completed-deliveries"
          />
        </motion.div>
      </motion.div>

      {/* Top Products and Manufacturers */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {/* Top Products */}
        <motion.div variants={itemVariants}>
          <Card
            className="p-4 glowing-border cursor-pointer hover-elevate transition-all backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 hover-zoom-glow-effect"
            onClick={() => setOpenDialog("topProducts")}
            data-testid="card-top-products"
          >
            <h3 className="font-semibold text-sm glowing-text mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Top Products
            </h3>
            <div className="space-y-3">
              {(liveStats?.topProducts || []).slice(0, 5).map((product, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{product.name}</span>
                  <span className="font-semibold">{product.units} units</span>
                </div>
              ))}
              {(!liveStats?.topProducts || liveStats.topProducts.length === 0) && (
                <p className="text-xs text-muted-foreground">No data available</p>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Top Manufacturers */}
        <motion.div variants={itemVariants}>
          <Card
            className="p-4 glowing-border cursor-pointer hover-elevate transition-all backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 hover-zoom-glow-effect"
            onClick={() => setOpenDialog("topManufacturers")}
            data-testid="card-top-manufacturers"
          >
            <h3 className="font-semibold text-sm glowing-text mb-4 flex items-center gap-2">
              <Factory className="w-4 h-4" />
              Top Manufacturers
            </h3>
            <div className="space-y-3">
              {(liveStats?.topManufacturers || []).slice(0, 5).map((mfg, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{mfg.name}</span>
                  <span className="font-semibold">{mfg.orders} orders</span>
                </div>
              ))}
              {(!liveStats?.topManufacturers || liveStats.topManufacturers.length === 0) && (
                <p className="text-xs text-muted-foreground">No data available</p>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button
          onClick={() => setLocation("/inventory")}
          className="zoom-pop backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 glowing-text hover-zoom-glow-effect"
          size="sm"
          data-testid="button-inventory"
        >
          <Package className="w-4 h-4 mr-2" />
          Manage Inventory
        </Button>
        <Button
          onClick={() => setLocation("/order")}
          className="zoom-pop backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 glowing-text hover-zoom-glow-effect"
          size="sm"
          data-testid="button-orders"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          View Orders
        </Button>
      </motion.div>

      {/* Detail Dialogs */}

      {/* Total Inventory Dialog */}
      <Dialog open={openDialog === "inventory"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Total Inventory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {assignedOrders.length > 0 ? (
              <div className="space-y-2">
                {assignedOrders.map((order) => (
                  <div key={order.orderId} className="p-3 border rounded-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{order.productName}</p>
                        <p className="text-xs text-muted-foreground">Order ID: {order.orderId}</p>
                        <p className="text-xs text-muted-foreground">Customer: {order.customerName}</p>
                        <p className="text-xs text-muted-foreground">Manufacturer: {order.manufacturerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{order.quantity} units</p>
                        <p className="text-xs text-muted-foreground">₹{order.totalPrice}</p>
                        <Badge className="mt-2" variant={getDisplayStatus(order.status) === "shipped" ? "default" : getDisplayStatus(order.status) === "cancelled" ? "destructive" : "secondary"}>
                          {getDisplayStatus(order.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No inventory items</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assigned Orders Dialog */}
      <Dialog open={openDialog === "assigned"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assigned Orders</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {assignedOrders.length > 0 ? (
              <div className="space-y-2">
                {assignedOrders.map((order) => (
                  <div key={order.orderId} className="p-3 border rounded-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{order.productName}</p>
                        <p className="text-xs text-muted-foreground">Order ID: {order.orderId}</p>
                        <p className="text-xs text-muted-foreground">Customer: {order.customerName}</p>
                        <p className="text-xs text-muted-foreground">Assigned: {new Date(order.assignedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{order.quantity} units</p>
                        <p className="text-xs text-muted-foreground">₹{order.totalPrice}</p>
                        <Badge className="mt-2" variant={getDisplayStatus(order.status) === "shipped" ? "default" : getDisplayStatus(order.status) === "cancelled" ? "destructive" : "secondary"}>
                          {getDisplayStatus(order.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No assigned orders</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Manufacturers Dialog */}
      <Dialog open={openDialog === "manufacturers"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Active Manufacturers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {uniqueManufacturers.length > 0 ? (
              <div className="space-y-2">
                {uniqueManufacturers.map((order) => (
                  <div key={order.manufacturerName} className="p-3 border rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{order.manufacturerName}</p>
                        <p className="text-xs text-muted-foreground">
                          Orders: {assignedOrders.filter(o => o.manufacturerName === order.manufacturerName).length}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Total Units: {assignedOrders
                            .filter(o => o.manufacturerName === order.manufacturerName)
                            .reduce((sum, o) => sum + o.quantity, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active manufacturers</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pending Orders Dialog */}
      <Dialog open={openDialog === "pending"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pending Orders</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {pendingOrdersData.length > 0 ? (
              <div className="space-y-2">
                {pendingOrdersData.map((order) => (
                  <div key={order.orderId} className="p-3 border rounded-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{order.productName}</p>
                        <p className="text-xs text-muted-foreground">Order ID: {order.orderId}</p>
                        <p className="text-xs text-muted-foreground">Manufacturer: {order.manufacturerName}</p>
                        <p className="text-xs text-muted-foreground">Customer: {order.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{order.quantity} units</p>
                        <p className="text-xs text-muted-foreground">₹{order.totalPrice}</p>
                        <Badge className="mt-2">Pending</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 justify-end">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => declineOrderMutation.mutate(order.orderId)}
                        disabled={declineOrderMutation.isPending}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => acceptOrderMutation.mutate(order.orderId)}
                        disabled={acceptOrderMutation.isPending}
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pending orders</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Completed Shipped Dialog */}
      <Dialog open={openDialog === "completed"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Completed Shipped Orders</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {completedDeliveries.length > 0 ? (
              <div className="space-y-3">
                {completedDeliveries.map((order) => (
                  <div key={order.orderId} className="p-4 border-2 border-green-200 dark:border-green-900 rounded-md bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-sm">{order.productName}</p>
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            Shipped
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Order ID: {order.orderId}</p>
                        <p className="text-xs text-muted-foreground">Manufacturer: {order.manufacturerName}</p>
                        <p className="text-xs text-muted-foreground">Customer: {order.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{order.quantity}</p>
                        <p className="text-xs text-muted-foreground">units</p>
                        <p className="font-semibold text-green-600 dark:text-green-400 mt-2">₹{order.totalPrice}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No completed deliveries</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Top Products Dialog */}
      <Dialog open={openDialog === "topProducts"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Top Products</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(liveStats?.topProducts || []).length > 0 ? (
              <div className="space-y-2">
                {liveStats?.topProducts?.map((product, idx) => (
                  <div key={idx} className="p-3 border rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">Rank #{idx + 1}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{product.units}</p>
                        <p className="text-xs text-muted-foreground">units ordered</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No product data available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Top Manufacturers Dialog */}
      <Dialog open={openDialog === "topManufacturers"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Top Manufacturers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(liveStats?.topManufacturers || []).length > 0 ? (
              <div className="space-y-2">
                {liveStats?.topManufacturers?.map((mfg, idx) => (
                  <div key={idx} className="p-3 border rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{mfg.name}</p>
                        <p className="text-xs text-muted-foreground">Rank #{idx + 1}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{mfg.orders}</p>
                        <p className="text-xs text-muted-foreground">orders</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No manufacturer data available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
