import { Card } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface AnalyticsChartProps {
  title: string;
  data: ChartData[];
  type?: "bar" | "line";
  dataKey: string;
  xAxisKey?: string;
}

export function AnalyticsChart({ title, data, type = "bar", dataKey, xAxisKey = "name" }: AnalyticsChartProps) {
  return (
    <Card className="p-6" data-testid={`chart-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        {type === "bar" ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey={xAxisKey} className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Legend />
            <Bar dataKey={dataKey} fill="hsl(var(--primary))" />
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey={xAxisKey} className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Legend />
            <Line type="monotone" dataKey={dataKey} stroke="hsl(var(--primary))" strokeWidth={2} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </Card>
  );
}
