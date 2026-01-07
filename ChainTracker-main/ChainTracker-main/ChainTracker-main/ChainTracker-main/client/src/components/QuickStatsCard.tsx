import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface QuickStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export function QuickStatsCard({ title, value, icon: Icon, trend, onClick }: QuickStatsCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="hover:[animation:menu-zoom-glow_0.5s_ease-in-out]"
    >
      <Card
        className="p-6 cursor-pointer hover-elevate transition-all duration-300 backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 glowing-border hover-zoom-glow-effect"
        onClick={onClick}
        data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <p className="text-3xl font-bold" data-testid={`text-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</p>
            {trend && (
              <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className="rounded-md bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
