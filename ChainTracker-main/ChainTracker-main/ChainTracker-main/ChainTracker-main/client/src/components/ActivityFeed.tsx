import { Package, Truck, CheckCircle, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Activity {
  id: string;
  type: "order" | "shipment" | "delivery" | "support";
  title: string;
  description: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  onActivityClick?: (id: string) => void;
}

const activityIcons = {
  order: Package,
  shipment: Truck,
  delivery: CheckCircle,
  support: MessageSquare,
};

const activityColors = {
  order: "text-blue-500 bg-blue-500/10",
  shipment: "text-purple-500 bg-purple-500/10",
  delivery: "text-green-500 bg-green-500/10",
  support: "text-orange-500 bg-orange-500/10",
};

export function ActivityFeed({ activities, onActivityClick }: ActivityFeedProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Activity Feed</h3>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];

            return (
              <div
                key={activity.id}
                className="flex gap-3 p-3 rounded-lg hover-elevate cursor-pointer"
                onClick={() => onActivityClick?.(activity.id)}
                data-testid={`activity-${activity.id}`}
              >
                <div className={`rounded-full p-2 ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
