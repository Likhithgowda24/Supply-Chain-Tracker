import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Bell, Mail, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    notificationsEnabled: localStorage.getItem("notificationsEnabled") !== "false",
    emailNotifications: localStorage.getItem("emailNotifications") !== "false",
    orderUpdates: localStorage.getItem("orderUpdates") !== "false",
    productUpdates: localStorage.getItem("productUpdates") !== "false",
    promotionalEmails: localStorage.getItem("promotionalEmails") !== "false",
  });

  const handleToggle = (key: keyof typeof settings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(newSettings);
    localStorage.setItem(key, String(newSettings[key]));
    
    const labels: Record<string, string> = {
      notificationsEnabled: "Push Notifications",
      emailNotifications: "Email Notifications",
      orderUpdates: "Order Updates",
      productUpdates: "Product Updates",
      promotionalEmails: "Promotional Emails",
    };

    toast({
      title: "Settings Updated",
      description: `${labels[key]} has been ${newSettings[key] ? "enabled" : "disabled"}`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/profile")}
          data-testid="button-back-settings"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your app preferences</p>
        </div>
      </div>

      {/* Notification Settings */}
      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage how you receive notifications and updates
          </p>
        </div>

        <div className="space-y-4 border-t pt-4">
          {/* Push Notifications */}
          <motion.div
            className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors"
            whileHover={{ x: 4 }}
          >
            <div className="flex items-center gap-3 flex-1">
              <Eye className="h-5 w-5 text-primary" />
              <div>
                <Label className="text-base font-medium cursor-pointer">
                  Push Notifications
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Receive real-time push notifications on your device
                </p>
              </div>
            </div>
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={() => handleToggle("notificationsEnabled")}
              data-testid="toggle-push-notifications"
            />
          </motion.div>

          {/* Email Notifications */}
          <motion.div
            className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors"
            whileHover={{ x: 4 }}
          >
            <div className="flex items-center gap-3 flex-1">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <Label className="text-base font-medium cursor-pointer">
                  Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Get email updates about your account and orders
                </p>
              </div>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={() => handleToggle("emailNotifications")}
              data-testid="toggle-email-notifications"
            />
          </motion.div>
        </div>
      </Card>

      {/* Update Preferences */}
      <Card className="p-6 space-y-6">
        <h2 className="text-2xl font-semibold">Update Preferences</h2>

        <div className="space-y-4 border-t pt-4">
          {/* Order Updates */}
          <motion.div
            className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors"
            whileHover={{ x: 4 }}
          >
            <div className="flex items-center gap-3 flex-1">
              <div>
                <Label className="text-base font-medium cursor-pointer">
                  Order Updates
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Get notified about order status changes, shipments, and deliveries
                </p>
              </div>
            </div>
            <Switch
              checked={settings.orderUpdates}
              onCheckedChange={() => handleToggle("orderUpdates")}
              data-testid="toggle-order-updates"
            />
          </motion.div>

          {/* Product Updates */}
          <motion.div
            className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors"
            whileHover={{ x: 4 }}
          >
            <div className="flex items-center gap-3 flex-1">
              <div>
                <Label className="text-base font-medium cursor-pointer">
                  Product Updates
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Notifications about new products and stock availability
                </p>
              </div>
            </div>
            <Switch
              checked={settings.productUpdates}
              onCheckedChange={() => handleToggle("productUpdates")}
              data-testid="toggle-product-updates"
            />
          </motion.div>

          {/* Promotional Emails */}
          <motion.div
            className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors"
            whileHover={{ x: 4 }}
          >
            <div className="flex items-center gap-3 flex-1">
              <div>
                <Label className="text-base font-medium cursor-pointer">
                  Promotional Emails
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Special offers, discounts, and marketing campaigns
                </p>
              </div>
            </div>
            <Switch
              checked={settings.promotionalEmails}
              onCheckedChange={() => handleToggle("promotionalEmails")}
              data-testid="toggle-promotional-emails"
            />
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}
