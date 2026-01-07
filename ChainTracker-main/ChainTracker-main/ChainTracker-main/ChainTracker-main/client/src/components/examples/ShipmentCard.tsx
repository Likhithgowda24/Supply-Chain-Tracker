import { ShipmentCard } from "../ShipmentCard";

export default function ShipmentCardExample() {
  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
      <ShipmentCard
        shipmentId="SCT-2024-001"
        productName="Wireless Bluetooth Headphones"
        status="in-transit"
        currentLocation="Mumbai Distribution Center"
        destination="Bangalore, Karnataka"
        estimatedDelivery="Dec 25, 2024"
        onClick={() => console.log("Shipment clicked")}
      />
      <ShipmentCard
        shipmentId="SCT-2024-002"
        productName="Smart Watch Series 5"
        status="delivered"
        currentLocation="Bangalore Delivery Hub"
        destination="Bangalore, Karnataka"
        estimatedDelivery="Dec 20, 2024"
        onClick={() => console.log("Shipment clicked")}
      />
      <ShipmentCard
        shipmentId="SCT-2024-003"
        productName="Laptop Stand Aluminum"
        status="pending"
        currentLocation="Delhi Warehouse"
        destination="Pune, Maharashtra"
        estimatedDelivery="Dec 28, 2024"
        onClick={() => console.log("Shipment clicked")}
      />
    </div>
  );
}
