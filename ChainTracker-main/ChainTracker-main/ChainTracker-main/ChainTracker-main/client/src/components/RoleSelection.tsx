import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Package, Building2, Truck } from "lucide-react";

interface RoleSelectionProps {
  onRoleSelect: (role: string) => void;
  isLoading?: boolean;
}

const roles = [
  {
    id: "customer",
    label: "Customer",
    icon: Package,
    description: "Browse and order products",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "manufacturer",
    label: "Manufacturer",
    icon: Building2,
    description: "Manage products and inventory",
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "supplier",
    label: "Supplier",
    icon: Truck,
    description: "Manage supplies and logistics",
    color: "from-orange-500 to-orange-600",
  },
];

export function RoleSelection({ onRoleSelect, isLoading }: RoleSelectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Select Your Role</h2>
        <p className="text-muted-foreground">Choose how you'll use Supply Chain Tracker</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role, idx) => {
          const Icon = role.icon;
          return (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card
                className="p-6 hover-scale cursor-pointer group"
                onClick={() => onRoleSelect(role.id)}
                data-testid={`card-role-${role.id}`}
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">{role.label}</h3>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
