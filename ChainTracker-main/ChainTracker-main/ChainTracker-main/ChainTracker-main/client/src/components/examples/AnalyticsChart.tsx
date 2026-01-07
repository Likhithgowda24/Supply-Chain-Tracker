import { AnalyticsChart } from "../AnalyticsChart";

const salesData = [
  { name: "Jan", value: 4000 },
  { name: "Feb", value: 3000 },
  { name: "Mar", value: 5000 },
  { name: "Apr", value: 4500 },
  { name: "May", value: 6000 },
  { name: "Jun", value: 5500 },
];

const revenueData = [
  { name: "Jan", value: 120000 },
  { name: "Feb", value: 98000 },
  { name: "Mar", value: 155000 },
  { name: "Apr", value: 142000 },
  { name: "May", value: 189000 },
  { name: "Jun", value: 176000 },
];

export default function AnalyticsChartExample() {
  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl">
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
    </div>
  );
}
