import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, Calendar, DollarSign } from "lucide-react";
import type { Order } from "@shared/schema";

interface OrderDetailsDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors = {
  placed: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  shipped: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  delivered: "bg-green-500/10 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
  "in-transit": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
};

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-order-details">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            Order ID: {order.orderId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge className={statusColors[order.status || "placed"]} data-testid="badge-order-status">
              {order.status?.toUpperCase()}
            </Badge>
          </div>

          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium break-words">Product</p>
              <p className="text-sm text-muted-foreground break-words overflow-hidden" data-testid="text-product-id">{order.productId}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium break-words">Total Price</p>
              <p className="text-sm text-muted-foreground break-words overflow-hidden" data-testid="text-total-price">
                ₹{parseFloat(order.totalPrice as any).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium break-words">Quantity</p>
              <p className="text-sm text-muted-foreground break-words overflow-hidden" data-testid="text-quantity">{order.quantity}</p>
            </div>
          </div>

          {(order.shippingAddress as any) && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium break-words">Shipping Address</p>
                <p className="text-sm text-muted-foreground break-words overflow-hidden" data-testid="text-shipping-address">
                  {typeof order.shippingAddress === 'string'
                    ? order.shippingAddress
                    : JSON.stringify(order.shippingAddress)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium break-words">Order Date</p>
              <p className="text-sm text-muted-foreground break-words overflow-hidden" data-testid="text-order-date">
                {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>

          {order.updatedAt && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium break-words">Last Updated</p>
                <p className="text-sm text-muted-foreground break-words overflow-hidden" data-testid="text-last-updated">
                  {new Date(order.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
