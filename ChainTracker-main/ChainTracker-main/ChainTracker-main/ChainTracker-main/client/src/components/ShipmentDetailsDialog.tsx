import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Truck, Package } from "lucide-react";

interface ShipmentDetailsDialogProps {
  shipment: {
    shipmentId: string;
    productName: string;
    status: "pending" | "in-transit" | "delivered" | "delayed";
    currentLocation: string;
    destination: string;
    estimatedDelivery: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  "in-transit": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  delivered: "bg-green-500/10 text-green-700 dark:text-green-400",
  delayed: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export function ShipmentDetailsDialog({ shipment, open, onOpenChange }: ShipmentDetailsDialogProps) {
  if (!shipment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-shipment-details">
        <DialogHeader>
          <DialogTitle>Shipment Details</DialogTitle>
          <DialogDescription>
            Shipment ID: {shipment.shipmentId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge className={statusColors[shipment.status]} data-testid="badge-shipment-status">
              {shipment.status.toUpperCase()}
            </Badge>
          </div>

          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Product</p>
              <p className="text-sm text-muted-foreground" data-testid="text-product-name">{shipment.productName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Current Location</p>
              <p className="text-sm text-muted-foreground" data-testid="text-current-location">
                {shipment.currentLocation}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Destination</p>
              <p className="text-sm text-muted-foreground" data-testid="text-destination">
                {shipment.destination}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Estimated Delivery</p>
              <p className="text-sm text-muted-foreground" data-testid="text-estimated-delivery">
                {shipment.estimatedDelivery}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
