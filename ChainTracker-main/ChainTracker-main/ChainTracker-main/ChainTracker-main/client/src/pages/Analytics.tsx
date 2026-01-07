import { AnalyticsChart } from "@/components/AnalyticsChart";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

// Format quantity with k, L, M suffix
function formatQuantity(amount: number): string {
  if (amount >= 10000000) {
    return (amount / 1000000).toFixed(2) + "M";
  } else if (amount >= 100000) {
    return (amount / 100000).toFixed(2) + "L";
  } else if (amount >= 1000) {
    return (amount / 1000).toFixed(2) + "k";
  }
  return amount.toFixed(0);
}

interface AnalyticsMetrics {
  totalRevenue: number;
  activeShipments: number;
  avgDeliveryTime: number;
  satisfaction: number;
  salesData: Array<{ name: string; value: number }>;
  revenueData: Array<{ name: string; value: number }>;
  shipmentsData: Array<{ name: string; value: number }>;
  statusData: Array<{ name: string; value: number }>;
}

export default function Analytics() {
  // Fetch analytics with live polling every 2 seconds
  const { data: analyticsData } = useQuery<AnalyticsMetrics>({
    queryKey: ["/api/analytics"],
    refetchInterval: 2000, // Poll every 2 seconds
    staleTime: 0, // Data is always stale
    gcTime: 0, // Don't cache data
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
    enabled: true,
  });

  // Default fallback data in case API is not available yet
  const salesData = analyticsData?.salesData || [];
  const revenueData = analyticsData?.revenueData || [];
  const shipmentsData = analyticsData?.shipmentsData || [];
  const statusData = analyticsData?.statusData || [];

  const totalRevenue = analyticsData?.totalRevenue || 0;
  const activeShipments = analyticsData?.activeShipments || 0;
  const avgDeliveryTime = analyticsData?.avgDeliveryTime || 0;
  const satisfaction = analyticsData?.satisfaction || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-4xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">Track your supply chain performance and trends</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30" data-testid="card-total-revenue">
          <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
          <p className="text-3xl font-bold text-white mb-1">{formatQuantity(totalRevenue)}</p>
          {analyticsData && <p className="text-xs text-gray-400">({totalRevenue})</p>}
          <p className="text-xs text-green-600 mt-2">↑ 12.5% from last month</p>
        </Card>
        <Card className="p-6" data-testid="card-active-shipments">
          <p className="text-sm text-muted-foreground mb-1">Active Shipments</p>
          <p className="text-3xl font-bold">{activeShipments.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">↑ 8.2% from last week</p>
        </Card>
        <Card className="p-6" data-testid="card-avg-delivery-time">
          <p className="text-sm text-muted-foreground mb-1">Avg. Delivery Time</p>
          <p className="text-3xl font-bold">{avgDeliveryTime} days</p>
          <p className="text-xs text-green-600 mt-1">↓ 0.5 days faster</p>
        </Card>
        <Card className="p-6" data-testid="card-satisfaction">
          <p className="text-sm text-muted-foreground mb-1">Customer Satisfaction</p>
          <p className="text-3xl font-bold">{satisfaction}/5</p>
          <p className="text-xs text-green-600 mt-1">↑ 0.2 points</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          title="Monthly Sales"
          data={salesData}
          type="bar"
          dataKey="value"
        />
        <AnalyticsChart
          title="Revenue Trend"
          data={revenueData}
          type="line"
          dataKey="value"
        />
        <AnalyticsChart
          title="Weekly Shipments"
          data={shipmentsData}
          type="bar"
          dataKey="value"
        />
        <AnalyticsChart
          title="Shipment Status Distribution"
          data={statusData}
          type="bar"
          dataKey="value"
        />
      </div>
    </motion.div>
  );
}
