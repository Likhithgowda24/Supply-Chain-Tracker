import { Package, MapPin, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ShipmentCardProps {
  shipmentId: string;
  productName: string;
  status: "pending" | "in-transit" | "delivered" | "delayed" | "shipped";
  currentLocation: string;
  destination: string;
  estimatedDelivery: string;
  onClick?: () => void;
}

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  "in-transit": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  delivered: "bg-green-500/10 text-green-700 dark:text-green-400",
  delayed: "bg-red-500/10 text-red-700 dark:text-red-400",
  shipped: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
};

export function ShipmentCard({
  shipmentId,
  productName,
  status,
  currentLocation,
  destination,
  estimatedDelivery,
  onClick,
}: ShipmentCardProps) {
  return (
    <Card className="p-4 hover-elevate cursor-pointer hover:[animation:menu-zoom-glow_0.5s_ease-in-out] transition-all duration-300" onClick={onClick} data-testid={`card-shipment-${shipmentId}`}>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-primary" />
              <p className="font-mono text-xs text-muted-foreground" data-testid={`text-shipment-id-${shipmentId}`}>
                {shipmentId}
              </p>
            </div>
            <h3 className="font-semibold line-clamp-1">{productName}</h3>
          </div>
          <Badge className={statusColors[status]} data-testid={`badge-status-${shipmentId}`}>
            {status.replace("-", " ")}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="flex-1 truncate">{currentLocation}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="flex-1 truncate">→ {destination}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{estimatedDelivery}</span>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full" data-testid={`button-track-${shipmentId}`}>
          Track Shipment
        </Button>
      </div>
    </Card>
  );
}
