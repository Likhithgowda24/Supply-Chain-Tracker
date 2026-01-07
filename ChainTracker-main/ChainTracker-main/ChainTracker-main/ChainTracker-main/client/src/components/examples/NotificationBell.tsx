import { NotificationBell } from "../NotificationBell";

const mockNotifications = [
  {
    id: "1",
    type: "order" as const,
    title: "New Order Placed",
    message: "Order #SCT-2024-001 has been placed by John Doe",
    time: "2 min ago",
    read: false,
  },
  {
    id: "2",
    type: "support" as const,
    title: "Support Ticket",
    message: "Customer raised a support ticket regarding shipment delay",
    time: "15 min ago",
    read: false,
  },
  {
    id: "3",
    type: "feedback" as const,
    title: "New Feedback",
    message: "5-star rating received for order #SCT-2024-002",
    time: "1 hour ago",
    read: true,
  },
];

export default function NotificationBellExample() {
  return (
    <div className="p-8 flex justify-center">
      <NotificationBell
        notifications={mockNotifications}
        onNotificationClick={(id) => console.log("Notification clicked:", id)}
      />
    </div>
  );
}
