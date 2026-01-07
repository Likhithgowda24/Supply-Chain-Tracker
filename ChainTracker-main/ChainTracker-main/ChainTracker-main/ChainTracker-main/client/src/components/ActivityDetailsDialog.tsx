import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Truck, Package, Clock } from "lucide-react";

interface ActivityDetailsDialogProps {
  activity: {
    id: string;
    type: "order" | "shipment" | "delivery";
    title: string;
    description: string;
    timestamp: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons = {
  order: ShoppingCart,
  shipment: Truck,
  delivery: Package,
};

const typeColors = {
  order: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  shipment: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  delivery: "bg-green-500/10 text-green-700 dark:text-green-400",
};

export function ActivityDetailsDialog({ activity, open, onOpenChange }: ActivityDetailsDialogProps) {
  if (!activity) return null;

  const Icon = typeIcons[activity.type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-activity-details">
        <DialogHeader>
          <DialogTitle>Activity Details</DialogTitle>
          <DialogDescription>
            Activity ID: {activity.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <Badge className={typeColors[activity.type]} data-testid="badge-activity-type">
              {activity.type.toUpperCase()}
            </Badge>
          </div>

          <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Title</p>
              <p className="text-sm text-muted-foreground" data-testid="text-activity-title">
                {activity.title}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground" data-testid="text-activity-description">
                {activity.description}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Timestamp</p>
              <p className="text-sm text-muted-foreground" data-testid="text-activity-timestamp">
                {activity.timestamp}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
