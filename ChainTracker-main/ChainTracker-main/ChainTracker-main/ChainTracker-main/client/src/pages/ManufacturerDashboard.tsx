import { Package, Users, TrendingUp, Factory, Plus, Search, Send, X, MapPin, Truck } from "lucide-react";
import { QuickStatsCard } from "@/components/QuickStatsCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TransactionDialog } from "@/components/TransactionDialog";
import { ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ManufacturerStats {
  totalProducts: number;
  inStock: number;
  inProduction: number;
  activeOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  productionRate: number;
  onScheduleRate: number;
  delayedRate: number;
  productionStatusBreakdown: {
    inProduction: number;
    qualityCheck: number;
    readyToShip: number;
  };
  topProducts: Array<{ name: string; units: number }>;
  topSuppliers: Array<{ name: string; orders: number }>;
}

export default function ManufacturerDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [productionDetailsOpen, setProductionDetailsOpen] = useState(false);
  const [productionEditOpen, setProductionEditOpen] = useState(false);
  const [inProduction, setInProduction] = useState(0);
  const [qualityCheck, setQualityCheck] = useState(0);
  const [readyToShip, setReadyToShip] = useState(0);
  // Real-time graph data state
  const [graphData, setGraphData] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      time: i,
      efficiency: 75 + Math.random() * 15, // Efficiency %
      output: 100 + Math.random() * 100,  // Output Units
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setGraphData(prev => {
        const lastTime = prev[prev.length - 1].time;

        // Smoother random walk for efficiency
        const lastEff = prev[prev.length - 1].efficiency;
        const effChange = (Math.random() - 0.5) * 5;
        let newEff = Math.max(60, Math.min(98, lastEff + effChange));

        // Output tends to correlate slightly with efficiency
        const newOutput = Math.max(50, Math.min(300, 150 + (newEff - 75) * 5 + (Math.random() - 0.5) * 50));

        return [...prev.slice(1), {
          time: lastTime + 1,
          efficiency: newEff,
          output: newOutput
        }];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const [sendOrderDialogOpen, setSendOrderDialogOpen] = useState(false);
  const [selectedOrderForSending, setSelectedOrderForSending] = useState<any>(null);
  const [selectedSupplierForOrder, setSelectedSupplierForOrder] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch live stats with aggressive polling for real-time updates
  const { data: liveStats, isLoading: statsLoading } = useQuery<ManufacturerStats>({
    queryKey: ["/api/manufacturer/stats"],
    refetchInterval: 2000, // Poll every 2 seconds for live updates
    staleTime: 0, // Consider data stale immediately
    gcTime: 0, // Don't cache data
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnReconnect: true, // Refetch when reconnecting to network
    retry: 1, // Retry once on failure
    enabled: true, // Always enabled
  });

  // Fetch pending orders with aggressive polling for real-time updates
  const { data: livePendingOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/manufacturer/pending-orders"],
    refetchInterval: 2000, // Poll every 2 seconds for live updates
    staleTime: 0, // Consider data stale immediately
    gcTime: 0, // Don't cache data
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnReconnect: true, // Refetch when reconnecting to network
    retry: 1, // Retry once on failure
    enabled: true, // Always enabled
  });

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/manufacturer/suppliers"],
    refetchInterval: 2000,
    staleTime: 0,
    gcTime: 0,
  });

  // Sync local state with liveStats when data arrives
  useEffect(() => {
    if (liveStats?.productionStatusBreakdown) {
      setInProduction(liveStats.productionStatusBreakdown.inProduction || 0);
      setQualityCheck(liveStats.productionStatusBreakdown.qualityCheck || 0);
      setReadyToShip(liveStats.productionStatusBreakdown.readyToShip || 0);
    }
  }, [liveStats]);

  // Update production status mutation
  const updateProductionStatusMutation = useMutation({
    mutationFn: async (data: { inProduction: number; qualityCheck: number; readyToShip: number }) => {
      return await apiRequest("POST", "/api/manufacturer/production-status", data);
    },
    onSuccess: (response, variables) => {
      // Update local state immediately with saved values
      setInProduction(variables.inProduction);
      setQualityCheck(variables.qualityCheck);
      setReadyToShip(variables.readyToShip);

      // Invalidate query for data consistency
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturer/stats"] });
      setProductionEditOpen(false);
      toast({
        title: "Success",
        description: "Production status updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update production status",
        variant: "destructive",
      });
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order status updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturer/pending-orders"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  // Send order to supplier mutation
  const sendOrderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrderForSending || selectedSupplierIds.length === 0) {
        throw new Error("Order and at least one supplier required");
      }
      return await apiRequest("POST", "/api/manufacturer/send-order", {
        orderId: selectedOrderForSending.id,
        supplierIds: selectedSupplierIds,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order sent to suppliers successfully!",
      });
      setSendOrderDialogOpen(false);
      setSelectedOrderForSending(null);
      setSelectedSupplierIds([]);
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturer/pending-orders"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send order to suppliers",
        variant: "destructive",
      });
    },
  });

  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);

  const toggleSupplierSelection = (supplierId: string) => {
    setSelectedSupplierIds(prev =>
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };



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

  const stats = [
    {
      title: "Total Products",
      value: liveStats?.totalProducts?.toString() || "0",
      icon: Package,
      trend: { value: 15.3, isPositive: true },
      onClick: () => {
        setSelectedStat("Total Products");
        setDetailsDialogOpen(true);
      }
    },
    {
      title: "Active Orders",
      value: (Array.isArray(livePendingOrders) ? livePendingOrders.filter(o => o.status === "placed").length : 0).toString(),
      icon: TrendingUp,
      trend: { value: 8.2, isPositive: true },
      onClick: () => {
        setSelectedStat("Active Orders");
        setDetailsDialogOpen(true);
      }
    },
    {
      title: "Total Suppliers",
      value: liveStats?.totalSuppliers?.toString() || "0",
      icon: Users,
      trend: { value: 5.1, isPositive: true },
      onClick: () => {
        setSelectedStat("Total Suppliers");
        setDetailsDialogOpen(true);
      }
    },
    {
      title: "Production Rate",
      value: `${inProduction || liveStats?.productionStatusBreakdown?.inProduction || 0}%`,
      icon: Factory,
      trend: { value: 2.3, isPositive: true },
      onClick: () => {
        setSelectedStat("Production Rate");
        setDetailsDialogOpen(true);
      }
    },
  ];

  const recentProducts = [
    { id: 1, name: "Industrial Component A", sku: "MFG-001", quantity: 500, status: "In Production" },
    { id: 2, name: "Electronics Module B", sku: "MFG-002", quantity: 250, status: "Quality Check" },
    { id: 3, name: "Advanced Sensor C", sku: "MFG-003", quantity: 100, status: "Ready to Ship" },
    { id: 4, name: "Circuit Board D", sku: "MFG-004", quantity: 150, status: "Pending Orders" },
  ];

  const renderStatDetails = () => {
    switch (selectedStat) {
      case "Total Products":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-muted-foreground text-sm">In Stock</p>
                <p className="text-2xl font-bold text-primary">{liveStats?.inStock || 0}</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-muted-foreground text-sm">In Production</p>
                <p className="text-2xl font-bold text-primary">{liveStats?.inProduction || 0}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Top Products:</p>
              <div className="space-y-2">
                {liveStats?.topProducts?.length ? (
                  liveStats.topProducts.map((product, idx) => (
                    <div key={idx} className="flex justify-between text-sm p-2 hover:bg-secondary/20 rounded">
                      <span>{product.name}</span>
                      <span className="font-medium">{product.units} units</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No product data available</p>
                )}
              </div>
            </div>
          </div>
        );
      case "Active Orders":
        const pendingCount = Array.isArray(livePendingOrders) ? livePendingOrders.filter(o => o.status === "placed").length : 0;
        const inProgressCount = Array.isArray(livePendingOrders) ? livePendingOrders.filter(o => o.status !== "placed" && o.status !== "delivered" && o.status !== "cancelled").length : 0;

        return (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-muted-foreground text-sm">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
              </div>
            </div>
            <div className="space-y-2 border-t pt-4">
              <p className="font-semibold">Recent Pending Orders:</p>
              <div className="space-y-2">
                {livePendingOrders && livePendingOrders.length > 0 ? (
                  livePendingOrders.map((order) => (
                    <div key={order.id} className="p-3 bg-secondary/10 border border-secondary/30 rounded-lg hover:bg-secondary/20 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{order.orderId || order.id}</p>
                          <p className="text-xs text-primary">{order.productName}</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-700 rounded">
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs space-y-1 text-muted-foreground">
                        <p><span className="font-semibold">Customer:</span> {order.customerName}</p>
                        <p><span className="font-semibold">Email:</span> {order.customerEmail}</p>
                        <p><span className="font-semibold">Qty:</span> {order.quantity} units @ ₹{(typeof order.productPrice === 'number' ? order.productPrice : parseFloat(String(order.productPrice || 0))).toFixed(2)}</p>
                        <p className="font-semibold text-primary">Total: ₹{(typeof order.totalPrice === 'number' ? order.totalPrice : parseFloat(String(order.totalPrice || 0))).toFixed(2)}</p>
                      </div>
                      {order.status === "placed" && (
                        <Button
                          size="sm"
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                          onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: "in-transit" })}
                          disabled={updateOrderStatusMutation.isPending}
                          data-testid={`button-mark-transit-details-${order.id}`}
                        >
                          <Truck className="w-3 h-3 mr-1" />
                          Mark In Transit
                        </Button>
                      )}
                      {order.status === "in-transit" && (
                        <Button
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => {
                            setSelectedOrderForSending(order);
                            setSendOrderDialogOpen(true);
                          }}
                          data-testid={`button-send-order-details-${order.id}`}
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Send to Supplier
                        </Button>
                      )}
                      {order.status !== "placed" && order.status !== "in-transit" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto"
                          onClick={() => setLocation(`/track?id=${order.orderId}`)}
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          Track Order
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No pending orders</p>
                )}
              </div>
            </div>
          </div>
        );
      case "Total Suppliers":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Active</p>
                <p className="text-2xl font-bold text-primary">{liveStats?.activeSuppliers || 0}</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Inactive</p>
                <p className="text-2xl font-bold text-muted-foreground">{liveStats?.inactiveSuppliers || 0}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Top Suppliers by Orders:</p>
              <div className="space-y-2">
                {liveStats?.topSuppliers?.length ? (
                  liveStats.topSuppliers.map((supplier, idx) => (
                    <div key={idx} className="flex justify-between text-sm p-2 hover:bg-secondary/20 rounded">
                      <span>{supplier.name}</span>
                      <span className="font-medium">{supplier.orders} orders</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No supplier data available</p>
                )}
              </div>
            </div>
          </div>
        );
      case "Production Rate":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-muted-foreground text-sm">On Schedule</p>
                <p className="text-2xl font-bold text-green-600">{liveStats?.onScheduleRate || 0}%</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Delayed</p>
                <p className="text-2xl font-bold text-red-600">{liveStats?.delayedRate || 0}%</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Production Status (Live Updates):</p>
              <div className="space-y-2">
                <div className="p-2 hover:bg-secondary/20 rounded cursor-pointer" onClick={() => {
                  setProductionDetailsOpen(true);
                }} data-testid="button-production-status">
                  <div className="flex justify-between text-sm mb-1">
                    <span>In Production</span>
                    <span className="font-medium text-yellow-600">{inProduction}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${inProduction}%` }}></div>
                  </div>
                </div>
                <div className="p-2 hover:bg-secondary/20 rounded cursor-pointer" onClick={() => {
                  setProductionDetailsOpen(true);
                }} data-testid="button-quality-status">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Quality Check</span>
                    <span className="font-medium text-blue-600">{qualityCheck}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${qualityCheck}%` }}></div>
                  </div>
                </div>
                <div className="p-2 hover:bg-secondary/20 rounded cursor-pointer" onClick={() => {
                  setProductionDetailsOpen(true);
                }} data-testid="button-ready-status">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Ready to Ship</span>
                    <span className="font-medium text-green-600">{readyToShip}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${readyToShip}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manufacturer Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your production and orders</p>
        </div>
        <Button
          className="gap-2 w-full md:w-auto"
          data-testid="button-create-product"
          onClick={() => setLocation("/add-product")}
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} onClick={stat.onClick} className="cursor-pointer">
            <QuickStatsCard {...stat} />
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Status Section */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">Production Status</h2>
          </div>

          <div className="space-y-3">
            {/* Production Status Breakdown - Clickable Cards */}
            <div className="p-4 border rounded-lg hover-elevate cursor-pointer hover:[animation:menu-zoom-glow_0.5s_ease-in-out] transition-all duration-300" onClick={() => {
              setProductionDetailsOpen(true);
            }} data-testid="card-production-status">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">In Production</span>
                    <span className="text-yellow-600 font-bold">{inProduction}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${inProduction}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Quality Check</span>
                    <span className="text-blue-600 font-bold">{qualityCheck}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${qualityCheck}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Ready to Ship</span>
                    <span className="text-green-600 font-bold">{readyToShip}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${readyToShip}%` }}></div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">Click to view details and edit</p>
            </div>

            {/* Recent Products Section */}
            {/* Real-time Analytics Graph */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Real-time Production Efficiency</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground">Live</span>
                  </div>
                </div>
              </div>

              <div className="h-[350px] w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all duration-500">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={graphData}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="linePopup" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="time" hide={true} />
                    <YAxis
                      yAxisId="left"
                      hide={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                      domain={[0, 350]}
                      label={{ value: 'Units', angle: -90, position: 'insideLeft', fill: 'rgba(139,92,246,0.6)', fontSize: 10 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      hide={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                      domain={[50, 100]}
                      unit="%"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-3 rounded-lg shadow-2xl">
                              <p className="text-xs text-muted-foreground mb-2">Live Metrics</p>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
                                  <span className="text-sm font-medium text-cyan-500">
                                    Eff: {Number(payload[1].value).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                                  <span className="text-sm font-medium text-purple-400">
                                    Out: {Number(payload[0].value).toFixed(0)} units
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      formatter={(value) => <span className="text-xs text-muted-foreground ml-1">{value}</span>}
                    />

                    <Bar
                      yAxisId="left"
                      dataKey="output"
                      name="Units Processed"
                      fill="url(#barGradient)"
                      radius={[4, 4, 0, 0]}
                      barSize={12}
                      animationDuration={1500}
                    />

                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="efficiency"
                      fill="url(#linePopup)"
                      stroke="none"
                    />

                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="efficiency"
                      name="Efficiency %"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: "#fff", stroke: "#06b6d4", strokeWidth: 2 }}
                    />

                    <ReferenceLine y={85} yAxisId="right" stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'Target', fill: '#10b981', fontSize: 10, position: 'right' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pending Orders Sidebar */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-xl font-semibold">Pending Orders</h2>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-4">
            {livePendingOrders.map((order) => (
              <motion.div
                key={order.id}
                whileHover={{ scale: 1.02 }}
                className="hover:[animation:menu-zoom-glow_0.5s_ease-in-out] hover:[box-shadow:0_0_15px_rgba(147,51,234,0.6),0_0_25px_rgba(245,158,11,0.4)] transition-all duration-300"
              >
                <Card className="p-3 cursor-pointer hover-elevate" data-testid={`card-order-${order.id}`}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Package className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{order.id}</span>
                      </div>
                    </div>
                    <div className="text-xs space-y-1.5 pl-10">
                      {/* Product Information */}
                      <div className="bg-secondary/30 p-2 rounded">
                        <p className="font-semibold text-foreground text-sm">{order.productName}</p>
                        {order.productDescription && (
                          <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{order.productDescription}</p>
                        )}
                        <p className="text-primary font-medium text-xs mt-1">₹{(typeof order.productPrice === 'number' ? order.productPrice : parseFloat(String(order.productPrice || 0))).toFixed(2)}</p>
                      </div>

                      {/* Customer & Order Details */}
                      <div className="space-y-1">
                        <p className="text-muted-foreground"><span className="text-xs font-semibold text-foreground">Customer:</span> {order.customerName}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-primary font-semibold">Qty: {order.quantity}</span>
                          <span className="font-semibold text-primary">Total: ₹{(typeof order.totalPrice === 'number' ? order.totalPrice : parseFloat(String(order.totalPrice || 0))).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t">
                          <span className="text-xs text-muted-foreground">Due: {order.dueDate}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-700' : 'bg-blue-500/20 text-blue-700'}`}>
                            {order.status}
                          </span>
                        </div>
                        {order.status === "placed" && (
                          <Button
                            size="sm"
                            className="mt-2 w-full text-xs bg-blue-600 hover:bg-blue-700"
                            onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: "in-transit" })}
                            disabled={updateOrderStatusMutation.isPending}
                            data-testid={`button-mark-transit-${order.id}`}
                          >
                            <Truck className="w-3 h-3 mr-1" />
                            Mark In Transit
                          </Button>
                        )}
                        {order.status === "in-transit" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 w-full text-xs"
                            onClick={() => {
                              setSelectedOrderForSending(order);
                              setSendOrderDialogOpen(true);
                            }}
                            data-testid={`button-send-order-sidebar-${order.id}`}
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Send to Supplier
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedStat}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {renderStatDetails()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Production Status Details Dialog */}
      <Dialog open={productionDetailsOpen} onOpenChange={setProductionDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Production Status Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-secondary/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">In Production</p>
              <p className="text-2xl font-bold text-yellow-600">{inProduction}%</p>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${inProduction}%` }}></div>
              </div>
            </div>
            <div className="p-3 bg-secondary/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Quality Check</p>
              <p className="text-2xl font-bold text-blue-600">{qualityCheck}%</p>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${qualityCheck}%` }}></div>
              </div>
            </div>
            <div className="p-3 bg-secondary/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Ready to Ship</p>
              <p className="text-2xl font-bold text-green-600">{readyToShip}%</p>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${readyToShip}%` }}></div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setProductionDetailsOpen(false)} data-testid="button-close-details">Close</Button>
              <Button onClick={() => {
                setProductionDetailsOpen(false);
                setProductionEditOpen(true);
              }} data-testid="button-edit-from-details">Edit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Production Status Edit Dialog */}
      <Dialog open={productionEditOpen} onOpenChange={setProductionEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Production Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">In Production (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={inProduction}
                onChange={(e) => setInProduction(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                data-testid="input-in-production"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Quality Check (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={qualityCheck}
                onChange={(e) => setQualityCheck(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                data-testid="input-quality-check"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Ready to Ship (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={readyToShip}
                onChange={(e) => setReadyToShip(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                data-testid="input-ready-to-ship"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setProductionEditOpen(false)} data-testid="button-cancel">Cancel</Button>
              <Button onClick={() => updateProductionStatusMutation.mutate({ inProduction, qualityCheck, readyToShip })} disabled={updateProductionStatusMutation.isPending} data-testid="button-save-production">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Send Order to Supplier Dialog */}
      <Dialog open={sendOrderDialogOpen} onOpenChange={(open) => {
        setSendOrderDialogOpen(open);
        if (!open) setSelectedSupplierIds([]);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Order to Suppliers</DialogTitle>
            <DialogDescription>
              Select one or more suppliers. The first supplier to accept will get the order.
            </DialogDescription>
          </DialogHeader>
          {selectedOrderForSending && (
            <div className="space-y-4">
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-xs text-muted-foreground">Order Details</p>
                <p className="font-medium text-sm">{selectedOrderForSending.orderId || selectedOrderForSending.id}</p>
                <p className="text-xs text-primary mt-1">{selectedOrderForSending.productName}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Qty: {selectedOrderForSending.quantity} | Total: ₹{(typeof selectedOrderForSending.totalPrice === 'number' ? selectedOrderForSending.totalPrice : parseFloat(String(selectedOrderForSending.totalPrice || 0))).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Select Suppliers *</label>
                <div className="border rounded-md max-h-48 overflow-y-auto p-2 space-y-2">
                  {suppliers.length > 0 ? (
                    suppliers.map((supplier) => (
                      <div key={supplier.id} className="flex items-center space-x-2 p-2 hover:bg-secondary/20 rounded cursor-pointer" onClick={() => toggleSupplierSelection(supplier.id)}>
                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedSupplierIds.includes(supplier.id) ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                          {selectedSupplierIds.includes(supplier.id) && <div className="w-2 h-2 bg-primary-foreground rounded-sm" />}
                        </div>
                        <span className="text-sm">{supplier.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground p-2">No suppliers available</div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {selectedSupplierIds.length} supplier(s)
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSendOrderDialogOpen(false);
                    setSelectedOrderForSending(null);
                    setSelectedSupplierIds([]);
                  }}
                  size="sm"
                  data-testid="button-cancel-send"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => sendOrderMutation.mutate()}
                  disabled={sendOrderMutation.isPending || selectedSupplierIds.length === 0}
                  size="sm"
                  data-testid="button-confirm-send-order"
                >
                  {sendOrderMutation.isPending ? "Sending..." : "Send Order"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
