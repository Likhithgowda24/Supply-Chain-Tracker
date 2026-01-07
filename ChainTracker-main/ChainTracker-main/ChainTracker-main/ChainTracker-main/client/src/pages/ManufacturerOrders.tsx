import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, User, Mail, DollarSign, MapPin, Truck, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useBlockchainTransaction } from "@/hooks/useBlockchainTransaction";
import { TransactionDialog } from "@/components/TransactionDialog";

interface ManufacturerOrder {
  id: string;
  orderId: string;
  productName: string;
  productPrice: number;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  productId?: string;
}

interface ProductDetails {
  id: string;
  productId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
}

export default function ManufacturerOrders() {
  const [selectedOrder, setSelectedOrder] = useState<ManufacturerOrder | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const { toast } = useToast();
  const { isProcessing, steps, submitBlockchainTransaction, isConnected } = useBlockchainTransaction();
  const [showTxDialog, setShowTxDialog] = useState(false);

  const { data: rawOrders = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/manufacturer/all-orders"],
    refetchInterval: 2000,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: allProducts = [] } = useQuery<ProductDetails[]>({
    queryKey: ["/api/products"],
    refetchInterval: 5000,
    staleTime: 0,
  });

  const orders = rawOrders.map((order) => ({
    ...order,
    productPrice: Number(order.productPrice) || 0,
    totalPrice: Number(order.totalPrice) || 0,
  }));

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      if (!isConnected) {
        throw new Error("Wallet not connected. Please connect MetaMask first.");
      }

      // Show blockchain transaction dialog
      setShowTxDialog(true);
      const result = await submitBlockchainTransaction("shipOrder", orderId, { status });

      if (!result.success) {
        throw new Error(result.error || "Blockchain transaction failed");
      }

      return await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status, txHash: result.txHash });
    },
    onSuccess: (_, { status }) => {
      const statusLabels: Record<string, string> = {
        "placed": "Placed",
        "in-transit": "In-Transit",
        "processing": "Processing",
        "delivered": "Delivered",
      };
      toast({
        title: "Success",
        description: `Order status updated to ${statusLabels[status] || status}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturer/all-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturer/stats"] });
      setSelectedStatus("");
      setSelectedOrder(null);
      setShowTxDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
      setShowTxDialog(false);
    },
  });

  const statusColors: Record<string, string> = {
    "pending": "bg-yellow-500/20 text-yellow-700",
    "confirmed": "bg-blue-500/20 text-blue-700",
    "in-transit": "bg-purple-500/20 text-purple-700",
    "processing": "bg-orange-500/20 text-orange-700",
    "delivered": "bg-green-500/20 text-green-700",
    "cancelled": "bg-red-500/20 text-red-700",
  };

  const stats = {
    totalOrders: orders.length,
    totalRevenue: orders
      .filter(o => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.totalPrice, 0),
    deliveredOrders: orders.filter(o => o.status === "delivered").length,
    pendingOrders: orders
      .filter(o => o.status === "placed")
      .reduce((sum, o) => sum + o.quantity, 0),
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
        <h1 className="text-3xl font-bold mb-2 glowing-text">All Orders</h1>
        <p className="text-muted-foreground">
          Track all customer orders for your products
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-primary/20 bg-background/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold glowing-text">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card className="border border-primary/20 bg-background/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold glowing-text">₹{stats.totalRevenue.toFixed(0)}</div>
          </CardContent>
        </Card>

        <Card className="border border-primary/20 bg-background/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold glowing-text">{stats.deliveredOrders}</div>
          </CardContent>
        </Card>

        <Card className="border border-primary/20 bg-background/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold glowing-text">{stats.pendingOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Order Details</h2>
        {orders.length === 0 ? (
          <Card className="border border-primary/20 bg-background/50">
            <CardContent className="pt-8 pb-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                No orders found. Orders will appear here when customers purchase your products.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="border border-primary/20 bg-background/50 hover:border-primary/40 cursor-pointer transition-colors hover-elevate"
                onClick={() => setSelectedOrder(order)}
                data-testid={`card-manufacturer-order-${order.id}`}
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

                    {/* Location */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Location</p>
                      <p className="text-xs text-foreground line-clamp-2">{order.customerAddress}</p>
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
                        <Badge className={`${statusColors[order.status] || "bg-secondary/50"} text-xs`}>
                          {order.status}
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
        title="Order Update Transaction"
        description="Recording order status update on blockchain..."
        onConfirm={() => { }}
        onCancel={() => setShowTxDialog(false)}
        confirmText="Processing"
        cancelText="Close"
        details={{
          "Order": selectedOrder?.orderId || "N/A",
          "Status": selectedStatus || "N/A",
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
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{selectedOrder.customerAddress}</span>
                  </div>
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

              {/* Status & Date */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Status</p>
                <div className="flex items-center gap-2 justify-between">
                  <Badge className={statusColors[selectedOrder.status] || "bg-secondary/50"}>
                    {selectedOrder.status}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {selectedOrder.createdAt}
                  </div>
                </div>
              </div>

              {/* Update Status Section */}
              {selectedOrder.status === "placed" && (
                <div className="space-y-3 border-t pt-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Change Status</p>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger data-testid="select-order-status">
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in-transit">In-Transit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {!isConnected && (
                    <p className="text-xs text-red-500">⚠️ Connect wallet to update order status</p>
                  )}
                  <Button
                    onClick={() => {
                      if (selectedStatus && selectedOrder) {
                        updateStatusMutation.mutate({ orderId: selectedOrder.orderId, status: selectedStatus });
                      }
                    }}
                    disabled={updateStatusMutation.isPending || !selectedStatus || !isConnected}
                    className="w-full gap-2"
                    data-testid="button-update-status"
                  >
                    <Truck className="w-4 h-4" />
                    {updateStatusMutation.isPending ? "Processing..." : "Update Status & Record on Blockchain"}
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
