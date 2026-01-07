import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TutorialWrapper } from "@/components/TutorialWrapper";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { PrimeAIWidget } from "@/components/PrimeAIWidget";
import Dashboard from "@/pages/Dashboard";
import ManufacturerDashboard from "@/pages/ManufacturerDashboard";
import SupplierDashboard from "@/pages/SupplierDashboard";
import AddProduct from "@/pages/AddProduct";
import MyProducts from "@/pages/MyProducts";
import EditProduct from "@/pages/EditProduct";
import ProductTracking from "@/pages/ProductTracking";
import OrderTracking from "@/pages/OrderTracking";
import LoadingPage from "@/pages/LoadingPage";
import SplashScreen from "@/pages/SplashScreen";
import Shop from "@/pages/Shop";
import Wishlist from "@/pages/Wishlist";
import Customers from "@/pages/Customers";
import Retailers from "@/pages/Retailers";
import Suppliers from "@/pages/Suppliers";
import Manufacturers from "@/pages/Manufacturers";
import ManufacturerOrders from "@/pages/ManufacturerOrders";
import Analytics from "@/pages/Analytics";
import Support from "@/pages/Support";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Inventory from "@/pages/Inventory";
import SupplierOrders from "@/pages/SupplierOrders";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { NotificationDetailDialog } from "@/components/NotificationDetailDialog";
import { apiRequest } from "@/lib/queryClient";
import { NetworkError } from "@/components/NetworkError";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

function DashboardRouter() {
  const userRole = localStorage.getItem("role")?.toLowerCase() || "customer";

  if (userRole === "manufacturer") {
    return <ManufacturerDashboard />;
  }

  if (userRole === "supplier") {
    return <SupplierDashboard />;
  }

  return <Dashboard />;
}

function OrderRouter() {
  const userRole = localStorage.getItem("role")?.toLowerCase() || "customer";

  if (userRole === "manufacturer" || userRole === "admin") {
    return <ManufacturerOrders />;
  }

  if (userRole === "supplier") {
    return <SupplierOrders />;
  }

  return <OrderTracking />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardRouter} />
      <Route path="/track" component={ProductTracking} />
      <Route path="/loading" component={LoadingPage} />
      <Route path="/order" component={OrderRouter} />
      <Route path="/shop" component={Shop} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/customers" component={Customers} />
      <Route path="/retailers" component={Retailers} />
      <Route path="/suppliers" component={Suppliers} />
      <Route path="/manufacturers" component={Manufacturers} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/support" component={Support} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/add-product" component={AddProduct} />
      <Route path="/my-products" component={MyProducts} />
      <Route path="/edit-product/:id" component={EditProduct} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const [location] = useLocation();
  const isLoadingPage = location === "/loading";
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  const { data: userData } = useQuery<{
    id: string;
    username: string;
    email: string;
    avatar?: string;
  }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: notificationsData = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 5000,
  });

  const user = {
    name: userData?.username || localStorage.getItem("username") || "User",
    email: userData?.email || localStorage.getItem("email") || "user@example.com",
    avatar: userData?.avatar,
  };

  const notifications = (notificationsData || []).map((n: any) => ({
    id: n.id,
    type: n.type || "order",
    title: n.title || "Notification",
    message: n.message || "",
    time: n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "Recently",
    read: n.read || false,
    payload: n.payload,
  }));

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    window.location.href = "/";
  };

  const handleNotificationClick = useCallback((notification: any) => {
    setSelectedNotification(notification);
  }, []);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`, {});
      // Invalidate the notifications cache to refresh the list
      const { queryClient } = await import("@/lib/queryClient");
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  if (isLoadingPage) {
    return (
      <ThemeProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="w-full h-full"
    >
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <TutorialWrapper>
              <div className="flex h-screen w-screen glowing-bg overflow-hidden">
                <AppSidebar />
                <SidebarInset className="flex flex-col flex-1 overflow-hidden bg-transparent">
                  <TopBar
                    user={user}
                    notifications={notifications}
                    onSearch={(query) => console.log("Search:", query)}
                    onLogout={handleLogout}
                    onNotificationClick={handleNotificationClick}
                  />
                  <main className="flex-1 overflow-auto">
                    <div className="p-8 h-full">
                      <Router />
                    </div>
                  </main>
                </SidebarInset>
              </div>
            </TutorialWrapper>
          </SidebarProvider>
        </TooltipProvider>
      </ThemeProvider>
      <Toaster />
      <PrimeAIWidget />
      {selectedNotification && (
        <NotificationDetailDialog
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onMarkAsRead={handleMarkAsRead}
        />
      )}
    </motion.div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const { isOnline, lastSync } = useNetworkStatus();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const username = localStorage.getItem("username");

    const isAuth = !!(token && username);
    setIsAuthenticated(isAuth);

    // If authenticated, skip splash and go to dashboard
    // If not authenticated, show splash before login (initial state keeps it true)
    if (isAuth) {
      setShowSplash(false);
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center glowing-bg overflow-hidden">
        <div className="text-center">
          <div className="animate-pulse text-2xl font-bold glowing-text">
            Supply Chain Tracker
          </div>
        </div>
      </div>
    );
  }

  if (showSplash && !isAuthenticated) {
    return (
      <div className="fixed inset-0 overflow-hidden">
        <ThemeProvider>
          <TooltipProvider>
            <SplashScreen onComplete={() => setShowSplash(false)} />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </div>
    );
  }

  if (showSplash && isAuthenticated) {
    return (
      <div className="fixed inset-0 overflow-hidden">
        <ThemeProvider>
          <TooltipProvider>
            <SplashScreen onComplete={() => setShowSplash(false)} />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 overflow-hidden">
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <TooltipProvider>
              <Login />
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <QueryClientProvider client={queryClient}>
        <AuthenticatedApp />
        {!isOnline && (
          <NetworkError
            onRetry={() => { }}
            onOffline={() => { }} // Just close/hide if we had a state for it, but for now let it persist or maybe add a "dismiss" state
            lastSync={lastSync}
            isRetrying={false}
          />
        )}
      </QueryClientProvider>
    </div>
  );
}

export default App;
