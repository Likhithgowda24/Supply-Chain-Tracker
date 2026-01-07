import { TrackingTimeline } from "../TrackingTimeline";
import { Toaster } from "@/components/ui/toaster";

const mockEvents = [
  {
    id: "1",
    status: "ordered",
    location: "Order placed - Delhi Warehouse",
    timestamp: "2024-12-20 10:00 AM",
    txHash: "0x1234567890abcdef1234567890abcdef12345678",
    metadata: "Order confirmed and processing started",
  },
  {
    id: "2",
    status: "in-transit",
    location: "Package dispatched - Mumbai Hub",
    timestamp: "2024-12-21 02:30 PM",
    txHash: "0xabcdef1234567890abcdef1234567890abcdef12",
    metadata: "In transit to destination",
    isActive: true,
  },
  {
    id: "3",
    status: "in-transit",
    location: "Arrival at Bangalore Distribution Center",
    timestamp: "2024-12-22 09:15 AM",
    txHash: "0x567890abcdef1234567890abcdef1234567890ab",
  },
];

export default function TrackingTimelineExample() {
  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Shipment Tracking</h2>
      <TrackingTimeline events={mockEvents} />
      <Toaster />
    </div>
  );
}
