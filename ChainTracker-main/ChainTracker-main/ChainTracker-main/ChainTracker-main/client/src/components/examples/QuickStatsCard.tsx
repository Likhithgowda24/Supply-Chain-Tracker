import { QuickStatsCard } from "../QuickStatsCard";
import { Package, Truck, Users, CheckCircle } from "lucide-react";

export default function QuickStatsCardExample() {
  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <QuickStatsCard
        title="Active Products"
        value="2,847"
        icon={Package}
        trend={{ value: 12.5, isPositive: true }}
        onClick={() => console.log("Active Products clicked")}
      />
      <QuickStatsCard
        title="In Transit"
        value="1,243"
        icon={Truck}
        trend={{ value: 8.2, isPositive: true }}
        onClick={() => console.log("In Transit clicked")}
      />
      <QuickStatsCard
        title="Total Customers"
        value="8,924"
        icon={Users}
        trend={{ value: 3.1, isPositive: false }}
        onClick={() => console.log("Total Customers clicked")}
      />
      <QuickStatsCard
        title="Delivered"
        value="15,672"
        icon={CheckCircle}
        trend={{ value: 15.3, isPositive: true }}
        onClick={() => console.log("Delivered clicked")}
      />
    </div>
  );
}
