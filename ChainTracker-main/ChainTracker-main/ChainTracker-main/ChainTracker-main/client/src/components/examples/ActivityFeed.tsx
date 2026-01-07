import { ActivityFeed } from "../ActivityFeed";

const mockActivities = [
  {
    id: "1",
    type: "order" as const,
    title: "New Order Placed",
    description: "Order #SCT-2024-001 placed by John Doe for Wireless Headphones",
    timestamp: "5 minutes ago",
  },
  {
    id: "2",
    type: "shipment" as const,
    title: "Shipment in Transit",
    description: "Order #SCT-2024-002 has left Mumbai distribution center",
    timestamp: "1 hour ago",
  },
  {
    id: "3",
    type: "delivery" as const,
    title: "Delivery Completed",
    description: "Order #SCT-2024-003 successfully delivered to customer",
    timestamp: "2 hours ago",
  },
  {
    id: "4",
    type: "support" as const,
    title: "Support Ticket Created",
    description: "Customer inquiry about delayed shipment SCT-2024-004",
    timestamp: "3 hours ago",
  },
];

export default function ActivityFeedExample() {
  return (
    <div className="p-8 max-w-md">
      <ActivityFeed
        activities={mockActivities}
        onActivityClick={(id) => console.log("Activity clicked:", id)}
      />
    </div>
  );
}
