import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface NotificationDetailDialogProps {
  notification: any;
  onClose: () => void;
  onMarkAsRead?: (notificationId: string) => void;
}

export function NotificationDetailDialog({
  notification,
  onClose,
  onMarkAsRead,
}: NotificationDetailDialogProps) {
  
  const handleGotIt = async () => {
    if (!notification.read && onMarkAsRead) {
      await onMarkAsRead(notification.id);
    }
    onClose();
  };
  const getNotificationDetails = () => {
    if (notification.payload?.orderId) {
      return {
        label: "Order ID",
        value: notification.payload.orderId,
      };
    }
    return null;
  };

  const details = getNotificationDetails();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-notification-details">
        <DialogHeader className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <DialogTitle>{notification.title}</DialogTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
            data-testid="button-close-notification"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Message</p>
            <p className="text-base font-medium">{notification.message}</p>
          </div>

          {details && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">{details.label}</p>
              <Badge variant="outline" className="text-xs">
                {details.value}
              </Badge>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground mb-2">Time</p>
            <p className="text-xs">{notification.time}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Status</p>
            <Badge variant={notification.read ? "secondary" : "destructive"}>
              {notification.read ? "Read" : "Unread"}
            </Badge>
          </div>

          <Button
            variant="default"
            className="w-full"
            onClick={handleGotIt}
            data-testid="button-notification-ok"
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
