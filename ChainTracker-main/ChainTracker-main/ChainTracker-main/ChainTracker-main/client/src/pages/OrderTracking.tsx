import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Package,
  Truck,
  MapPin,
  ArrowLeft,
  AlertCircle,
  X,
  ShoppingCart,
  Navigation,
} from "lucide-react";

const cancelReasons = [
  "Changed my mind",
  "Found better price elsewhere",
  "Product delayed",
  "No longer needed",
  "Ordered by mistake",
  "Other",
];

export default function OrderTracking() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId");
  const { toast } = useToast();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelDetails, setCancelDetails] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(orderId);

  // Fetch all orders
  const { data: allOrders = [], isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const response = await fetch(`/api/orders`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (!response.ok) throw new Error("Orders not found");
      return response.json();
    },
    refetchInterval: 5000,
  });

  // Fetch products from database
  const { data: dbProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch(`/api/products`);
      if (!response.ok) throw new Error("Products not found");
      return response.json().then((data: any[]) =>
        data.filter((p: any) => p.image)
      );
    },
  });

  // Filter orders to only include those with products in Shop (products with images)
  const filteredOrders = allOrders.filter((order) =>
    dbProducts.some((product) => product.productId === order.productId)
  );

  // Get currently selected order from filtered orders or use URL param
  const order = filteredOrders.find((o) => o.orderId === selectedOrderId);
  const isLoading = ordersLoading || dbProducts.length === 0;

  // Get product details from already fetched dbProducts
  const product = order ? dbProducts.find((p: any) => p.productId === order.productId) : null;

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", `/api/orders/${selectedOrderId}`, {
        status: "cancelled",
        cancelReason,
        cancelDetails,
      });
    },
    onSuccess: () => {
      toast({
        title: "Order Cancelled",
        description: "Your order has been successfully cancelled",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setCancelDialogOpen(false);
      setSelectedOrderId(null);
      setCancelReason("");
      setCancelDetails("");
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel order",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <motion.div className="space-y-8">
        <div className="h-10 bg-muted animate-pulse rounded" />
      </motion.div>
    );
  }

  if (filteredOrders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">No Orders Yet</h2>
        <p className="text-muted-foreground mb-6">
          You haven't placed any orders for wishlisted products yet.
        </p>
        <Button onClick={() => setLocation("/shop")}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Start Shopping
        </Button>
      </motion.div>
    );
  }

  // Show list view if no order selected
  if (!selectedOrderId || !order) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">Click on any order to view details and manage it</p>
        </div>

        <div className="grid gap-4">
          {filteredOrders.map((o: any) => {
            const prod = Array.isArray(product) ? null : product;
            return (
              <Card
                key={o.id}
                className="p-4 cursor-pointer hover-elevate"
                onClick={() => setSelectedOrderId(o.orderId)}
                data-testid="card-order-item"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold">Order ID: {o.orderId}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Quantity: {o.quantity}</p>
                    <p className="text-sm font-medium">
                      Total: ₹{parseFloat(o.totalPrice).toLocaleString()}
                    </p>
                  </div>
                  <Badge className="capitalize">{o.status}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      </motion.div>
    );
  }

  const statusColors: Record<string, string> = {
    placed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    confirmed: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    shipped: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
    "in-transit": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
    delivered: "bg-green-500/10 text-green-700 dark:text-green-400",
    cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
  };

  const canCancel =
    order.status !== "delivered" && order.status !== "cancelled";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedOrderId(null)}
          data-testid="button-back-orders"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold mb-2">Order Tracking</h1>
          <p className="text-muted-foreground">
            Track your order and manage delivery
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Header */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Order ID</p>
                <p className="text-2xl font-mono font-bold">{order.orderId}</p>
              </div>
              <Badge
                className={
                  statusColors[order.status as keyof typeof statusColors] || ""
                }
              >
                {order.status.split("-").map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-6 border-b">
              <div>
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Product</p>
                <p className="font-medium">{product?.name || "Loading..."}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-sm text-muted-foreground">Quantity</p>
                <p className="text-lg font-semibold">{order.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-lg font-semibold">
                  ₹{parseFloat(order.totalPrice).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Order Timeline */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Order Status</h2>
            <div className="space-y-6">
              {(() => {
                const statusStepMap: Record<string, number> = {
                  placed: 0,
                  confirmed: 0,
                  "in-transit": 1,
                  shipped: 2,
                  delivered: 3,
                  cancelled: -1,
                };
                const currentStepIndex = statusStepMap[order.status] ?? 0;

                return [
                  {
                    icon: Package,
                    label: "Order Placed",
                  },
                  {
                    icon: Navigation,
                    label: "In Transit",
                  },
                  {
                    icon: Truck,
                    label: "Shipped",
                  },
                  {
                    icon: MapPin,
                    label: "Delivered",
                  },
                ].map((step, idx) => {
                  const isActive = idx <= currentStepIndex;
                  const isCompleted = idx < currentStepIndex;
                  const isLast = idx === 3;

                  return (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                            }`}
                        >
                          <step.icon className="h-5 w-5" />
                        </div>
                        {!isLast && (
                          <div
                            className={`w-0.5 h-12 mt-2 ${isCompleted ? "bg-primary" : "bg-muted"
                              }`}
                          />
                        )}
                      </div>
                      <div className="pt-2">
                        <p className="font-semibold">{step.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {isActive
                            ? isCompleted
                              ? "Completed"
                              : "In Progress"
                            : "Pending"}
                        </p>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </Card>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}</p>
                <p>
                  {order.shippingAddress.state} - {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              {canCancel ? (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setCancelDialogOpen(true)}
                  data-testid="button-cancel-order"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              ) : (
                <Button variant="outline" disabled className="w-full">
                  Cannot Cancel
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/shop")}
                data-testid="button-continue-shopping"
              >
                Continue Shopping
              </Button>
            </div>
          </Card>

          {order.status === "delivered" && (
            <Card className="p-6 bg-green-500/5 border-green-500/20">
              <p className="text-sm text-green-700 dark:text-green-400">
                Your order has been delivered successfully!
              </p>
            </Card>
          )}

          {order.status === "cancelled" && (
            <Card className="p-6 bg-red-500/5 border-red-500/20">
              <p className="text-sm text-red-700 dark:text-red-400">
                This order has been cancelled
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Please let us know why you want to cancel this order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason for Cancellation
              </label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger data-testid="select-cancel-reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {cancelReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {cancelReason && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Details</label>
                <Textarea
                  placeholder="Tell us more about your reason (optional)"
                  value={cancelDetails}
                  onChange={(e) => setCancelDetails(e.target.value)}
                  data-testid="textarea-cancel-details"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={cancelOrderMutation.isPending}
              data-testid="button-keep-order"
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelOrderMutation.mutate()}
              disabled={!cancelReason || cancelOrderMutation.isPending}
              data-testid="button-confirm-cancel"
            >
              {cancelOrderMutation.isPending ? "Cancelling..." : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
