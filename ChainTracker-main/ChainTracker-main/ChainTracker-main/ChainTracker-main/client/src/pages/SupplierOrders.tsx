import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, User, Mail, DollarSign, MapPin, Factory, CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useBlockchainTransaction } from "@/hooks/useBlockchainTransaction";
import { TransactionDialog } from "@/components/TransactionDialog";

interface AssignedOrder {
  orderId: string;
  productName: string;
  productPrice: number;
  customerName: string;
  customerEmail: string;
  quantity: number;
  totalPrice: number;
  status: string;
  manufacturerName: string;
  assignedAt: string;
}

export default function SupplierOrders() {
  const { toast } = useToast();
  const { isProcessing, steps, submitBlockchainTransaction, isConnected } = useBlockchainTransaction();
  const [selectedOrder, setSelectedOrder] = useState<AssignedOrder | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [showTxDialog, setShowTxDialog] = useState(false);
  const [txType, setTxType] = useState<"accept" | "ship">("accept");

  // Fetch accepted orders (displayed in main list)
  const { data: rawOrders = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/supplier/assigned-orders"],
    refetchInterval: 2000,
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch pending orders (those needing acceptance/decline)
  const { data: pendingOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/supplier/pending-orders"],
    refetchInterval: 2000,
    staleTime: 0,
    gcTime: 0,
  });

  // Accept order mutation
  const acceptMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!isConnected) {
        throw new Error("Wallet not connected. Please connect MetaMask first.");
      }

      setTxType("accept");
      setShowTxDialog(true);
      const result = await submitBlockchainTransaction("acceptOrder", orderId, {});

      if (!result.success) {
        throw new Error(result.error || "Blockchain transaction failed");
      }

      setActionInProgress(true);
      return await apiRequest("POST", `/api/supplier/accept-order/${orderId}`, { txHash: result.txHash });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Order accepted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/pending-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/assigned-orders"] });
      setSelectedOrder(null);
      setActionInProgress(false);
      setShowTxDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to accept order" });
      setActionInProgress(false);
      setShowTxDialog(false);
    },
  });

  // Decline order mutation
  const declineMutation = useMutation({
    mutationFn: async (orderId: string) => {
      setActionInProgress(true);
      return await apiRequest("POST", `/api/supplier/decline-order/${orderId}`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Order declined and removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/pending-orders"] });
      setSelectedOrder(null);
      setActionInProgress(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to decline order" });
      setActionInProgress(false);
    },
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!isConnected) {
        throw new Error("Wallet not connected. Please connect MetaMask first.");
      }

      setTxType("ship");
      setShowTxDialog(true);
      const result = await submitBlockchainTransaction("shipOrder", orderId, { status: "shipped" });

      if (!result.success) {
        throw new Error(result.error || "Blockchain transaction failed");
      }

      setActionInProgress(true);
      return await apiRequest("POST", `/api/supplier/update-order-status/${orderId}`, { status: "shipped", txHash: result.txHash });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Order marked as shipped!" });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/assigned-orders"] });
      setSelectedOrder(null);
      setActionInProgress(false);
      setShowTxDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update order status" });
      setActionInProgress(false);
      setShowTxDialog(false);
    },
  });

  // Convert all orders (accepted and pending) to ensure numeric prices
  const convertOrder = (order: any) => ({
    ...order,
    productPrice: typeof order.productPrice === 'number' ? order.productPrice : parseFloat(String(order.productPrice || 0)),
    totalPrice: typeof order.totalPrice === 'number' ? order.totalPrice : parseFloat(String(order.totalPrice || 0)),
  });

  // Deduplicate orders by orderId (backend stores by both ID and email)
  const deduplicateOrders = (orderList: any[]) => {
    const seen = new Set<string>();
    return orderList.filter(order => {
      if (seen.has(order.orderId)) {
        return false;
      }
      seen.add(order.orderId);
      return true;
    });
  };

  const orders = deduplicateOrders(rawOrders).map(convertOrder);
  const dedupedPendingOrders = deduplicateOrders(pendingOrders).map(convertOrder);

  // Remove pending orders that are already in accepted orders
  const acceptedOrderIds = new Set(orders.map(o => o.orderId));
  const convertedPendingOrders = dedupedPendingOrders.filter(
    order => !acceptedOrderIds.has(order.orderId)
  );

  // Helper function to get display status for badges
  const getDisplayStatus = (status: string): string => {
    if (status === "shipped") {
      return "shipped";
    }
    if (status === "delivered") {
      return "delivered";
    }
    if (status === "cancelled") {
      return "cancelled";
    }
    if (status === "placed" || status === "pending_acceptance") {
      return "pending";
    }
    return "accepted";
  };

  const statusColors: Record<string, string> = {
    "pending": "bg-yellow-500/20 text-yellow-700",
    "confirmed": "bg-blue-500/20 text-blue-700",
    "accepted": "bg-green-500/20 text-green-700",
    "shipped": "bg-cyan-500/20 text-cyan-700",
    "in-transit": "bg-purple-500/20 text-purple-700",
    "processing": "bg-orange-500/20 text-orange-700",
    "delivered": "bg-emerald-500/20 text-emerald-700",
    "cancelled": "bg-red-500/20 text-red-700",
  };

  const stats = {
    totalOrders: orders.length,
    totalValue: orders.reduce((sum, o) => sum + o.totalPrice, 0),
    shipped: orders.filter(o => getDisplayStatus(o.status) === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    pending: convertedPendingOrders.length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 glowing-text">Assigned Orders</h1>
        <p className="text-muted-foreground">
          Track orders assigned to you by manufacturers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border border-primary/20 bg-background/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accepted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold glowing-text">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card className="border border-primary/20 bg-background/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold glowing-text text-yellow-400">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="border border-primary/20 bg-background/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold glowing-text">₹{stats.totalValue.toFixed(0)}</div>
          </CardContent>
        </Card>

        <Card className="border border-primary/20 bg-background/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Shipped
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold glowing-text text-cyan-400">{stats.shipped}</div>
          </CardContent>
        </Card>

        <Card className="border border-primary/20 bg-background/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold glowing-text">{stats.delivered}</div>
          </CardContent>
        </Card>
      </div>



      {/* Orders List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Order Details</h2>
        {orders.length === 0 ? (
          <Card className="border border-primary/20 bg-background/50">
            <CardContent className="pt-8 pb-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                No assigned orders yet. Orders will appear here when manufacturers assign them to you.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card
                key={order.orderId}
                className="border border-primary/20 bg-background/50 hover:border-primary/40 cursor-pointer transition-colors hover-elevate"
                onClick={() => setSelectedOrder(order)}
                data-testid={`card-supplier-order-${order.orderId}`}
              >
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    {/* Order ID & Product */}
                    <div className="md:col-span-2">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Order</p>
                      <p className="font-medium text-foreground">{order.orderId}</p>
                      <p className="text-sm text-primary mt-1">{order.productName}</p>
                    </div>

                    {/* Customer Info */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Customer</p>
                      <p className="font-medium text-foreground text-sm">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground truncate">{order.customerEmail}</p>
                    </div>

                    {/* Manufacturer */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Manufacturer</p>
                      <p className="font-medium text-foreground text-sm">{order.manufacturerName}</p>
                    </div>

                    {/* Quantity & Price */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Qty & Price</p>
                      <p className="font-medium text-foreground">{order.quantity} units</p>
                      <p className="text-xs text-primary">₹{order.productPrice.toFixed(2)} each</p>
                    </div>

                    {/* Amount & Status */}
                    <div className="flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Total</p>
                        <p className="font-bold text-primary">₹{order.totalPrice.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge className={`${statusColors[getDisplayStatus(order.status)] || "bg-secondary/50"} text-xs`}>
                          {getDisplayStatus(order.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Blockchain Transaction Dialog */}
      <TransactionDialog
        open={showTxDialog}
        isProcessing={isProcessing}
        steps={steps}
        title={txType === "accept" ? "Order Acceptance Transaction" : "Shipment Transaction"}
        description={txType === "accept" ? "Recording order acceptance on blockchain..." : "Recording shipment on blockchain..."}
        onConfirm={() => { }}
        onCancel={() => setShowTxDialog(false)}
        confirmText="Processing"
        cancelText="Close"
        details={{
          "Order": selectedOrder?.orderId || "N/A",
          "Action": txType === "accept" ? "Accept" : "Mark as Shipped",
          "Amount": `₹${selectedOrder?.totalPrice.toFixed(2) || "0.00"}`,
        }}
      />

      {/* Order Details Dialog */}
      <Dialog
        open={selectedOrder !== null && !showTxDialog}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>{selectedOrder?.orderId}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Product Section */}
              <div className="bg-secondary/20 p-3 rounded-lg">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Product</p>
                <p className="font-semibold text-foreground">{selectedOrder.productName}</p>
                <p className="text-sm text-primary mt-1">₹{selectedOrder.productPrice.toFixed(2)} per unit</p>
              </div>

              {/* Customer Section */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Customer Information</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedOrder.customerEmail}</span>
                  </div>
                </div>
              </div>

              {/* Manufacturer Section */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Assigned By</p>
                <div className="flex items-center gap-2">
                  <Factory className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedOrder.manufacturerName}</span>
                </div>
              </div>

              {/* Order Details Section */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Order Information</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity:</span>
                    <span className="font-medium">{selectedOrder.quantity} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit Price:</span>
                    <span className="font-medium">₹{selectedOrder.productPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="font-bold text-primary text-lg">₹{selectedOrder.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Status</p>
                <Badge className={statusColors[getDisplayStatus(selectedOrder.status)] || "bg-secondary/50"}>
                  {getDisplayStatus(selectedOrder.status)}
                </Badge>
              </div>

              {/* Action Buttons for Pending Orders */}
              {(selectedOrder.status === "placed" || selectedOrder.status === "pending_acceptance") && (
                <div className="space-y-2 pt-4">
                  {!isConnected && (
                    <p className="text-xs text-red-500">⚠️ Connect wallet to accept/decline orders</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600/80 hover:bg-green-700"
                      onClick={() => acceptMutation.mutate(selectedOrder.orderId)}
                      disabled={actionInProgress || !isConnected}
                      data-testid="button-accept-order"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept & Lock on Blockchain
                    </Button>
                    <Button
                      className="flex-1 bg-red-600/80 hover:bg-red-700"
                      onClick={() => declineMutation.mutate(selectedOrder.orderId)}
                      disabled={actionInProgress}
                      data-testid="button-decline-order"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons for Accepted Orders */}
              {selectedOrder.status === "accepted" && (
                <div className="space-y-2 pt-4">
                  {!isConnected && (
                    <p className="text-xs text-red-500">⚠️ Connect wallet to mark as shipped</p>
                  )}
                  <Button
                    className="w-full bg-blue-600/80 hover:bg-blue-700"
                    onClick={() => updateStatusMutation.mutate(selectedOrder.orderId)}
                    disabled={actionInProgress || !isConnected}
                    data-testid="button-mark-shipped"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Mark as Shipped & Record on Blockchain
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
