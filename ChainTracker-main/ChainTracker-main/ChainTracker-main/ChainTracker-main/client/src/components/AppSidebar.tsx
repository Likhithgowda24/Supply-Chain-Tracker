import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  MessageSquare,
  Settings,
  MapPin,
  Plus,
  Box,
  Archive,
  Store,
  Truck,
  Boxes
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Logo } from "./Logo";

type MenuItem = {
  title: string;
  url: string;
  icon: any;
  roles: string[];
};

const allMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    roles: ["customer", "manufacturer", "retailer", "supplier", "admin"],
  },
  {
    title: "Track Product",
    url: "/track",
    icon: MapPin,
    roles: ["customer", "manufacturer", "retailer", "supplier", "admin"],
  },
  {
    title: "Orders",
    url: "/order",
    icon: Box,
    roles: ["customer", "manufacturer", "retailer", "supplier", "admin"],
  },
  {
    title: "Shop",
    url: "/shop",
    icon: ShoppingCart,
    roles: ["customer", "retailer", "admin"],
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
    roles: ["retailer", "admin"],
  },

  {
    title: "Suppliers",
    url: "/suppliers",
    icon: Truck,
    roles: ["manufacturer", "admin"],
  },
  {
    title: "Manufacturers",
    url: "/manufacturers",
    icon: Store,
    roles: ["supplier", "admin"],
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: Boxes,
    roles: ["supplier", "admin"],
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
    roles: ["manufacturer", "retailer", "admin"],
  },
  {
    title: "Support",
    url: "/support",
    icon: MessageSquare,
    roles: ["customer", "manufacturer", "retailer", "supplier", "admin"],
  },
  {
    title: "My Products",
    url: "/my-products",
    icon: Archive,
    roles: ["manufacturer", "admin"],
  },
  {
    title: "Add Product",
    url: "/add-product",
    icon: Plus,
    roles: ["manufacturer", "admin"],
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const userRole = localStorage.getItem("role")?.toLowerCase() || "customer";

  const { data: rawOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/manufacturer/all-orders"],
    refetchInterval: 2000,
    staleTime: 0,
    gcTime: 0,
    enabled: userRole === "manufacturer" || userRole === "admin",
  });

  const pendingOrdersCount = (rawOrders || []).filter(
    (order) => order.status === "placed" || order.status === "pending" || order.status === "confirmed"
  ).length;

  const menuItems = useMemo(() => {
    return allMenuItems.filter((item) => item.roles.includes(userRole));
  }, [userRole]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 bg-transparent border-0 group-data-[collapsible=icon]:!p-2 transition-all duration-300">
        <div className="flex items-center gap-3 justify-center group-data-[collapsible=icon]:gap-0">
          <Logo size="sm" showText={false} />
          <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden opacity-100 transition-opacity duration-300">
            <span className="text-sm font-bold glowing-text whitespace-nowrap">Supply Chain</span>
            <span className="text-xs font-semibold tracking-widest glowing-text-accent whitespace-nowrap">TRACKER</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title} className="sidebar-menu-item hover:animate-none">
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    className="hover:[animation:menu-zoom-glow_0.5s_ease-in-out] transition-all duration-300"
                  >
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className="sidebar-menu-item">
                <SidebarMenuButton asChild isActive={location === "/settings"}>
                  <Link href="/settings" data-testid="link-settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
