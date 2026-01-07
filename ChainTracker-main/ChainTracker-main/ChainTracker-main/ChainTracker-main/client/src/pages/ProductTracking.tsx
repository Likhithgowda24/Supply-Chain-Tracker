import { useState, useEffect } from "react";
import { Search, Package, Radio, MapPin, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrackingTimeline } from "@/components/TrackingTimeline";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

import smartphoneImage from "@assets/generated_images/premium_smartphone_device.png";
import headphonesImage from "@assets/generated_images/premium_wireless_headphones.png";
import laptopImage from "@assets/generated_images/modern_aluminum_laptop.png";
import smartwatchImage from "@assets/generated_images/elegant_smartwatch.png";
import speakerImage from "@assets/generated_images/premium_portable_speaker.png";

const allProducts = [
  {
    id: "PROD-001",
    name: "Wireless Bluetooth Headphones",
    price: 2499,
    category: "Electronics",
    stock: 45,
    image: headphonesImage,
  },
  {
    id: "PROD-002",
    name: "Smart Watch Series 5",
    price: 12999,
    category: "Wearables",
    stock: 23,
    image: smartwatchImage,
  },
  {
    id: "PROD-003",
    name: "Premium Smartphone Pro Max",
    price: 89999,
    category: "Electronics",
    stock: 15,
    image: smartphoneImage,
  },
  {
    id: "PROD-004",
    name: "Ultra-thin Aluminum Laptop",
    price: 84999,
    category: "Computers",
    stock: 8,
    image: laptopImage,
  },
  {
    id: "PROD-005",
    name: "Premium Portable Speaker",
    price: 4999,
    category: "Audio",
    stock: 34,
    image: speakerImage,
  },
  {
    id: "PROD-006",
    name: "Wireless Gaming Mouse",
    price: 1499,
    category: "Accessories",
    stock: 67,
    image: headphonesImage,
  },
];

interface MatchedOrder {
  orderId: string;
  productName: string;
  customerName: string;
  quantity: number;
  status: string;
  shippingAddress: {
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: string;
}

interface TrackingData {
  events: any[];
}

export default function ProductTracking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchId, setSearchId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || "";
  });
  const [showTracking, setShowTracking] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!params.get("id");
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Trim searchId for proper API queries
  const trimmedSearchId = searchId.trim();

  const { data: trackingData, isLoading } = useQuery<TrackingData>({
    queryKey: ["/api/tracking", trimmedSearchId],
    enabled: showTracking && !!trimmedSearchId,
    refetchInterval: 2000,
  });

  // Fetch order details by order ID to get customer's address and information
  const { data: matchedOrder } = useQuery<MatchedOrder>({
    queryKey: ["/api/orders", trimmedSearchId],
    enabled: showTracking && !!trimmedSearchId && !trimmedSearchId.toUpperCase().startsWith("PROD-"),
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (trackingData || matchedOrder) {
      setLastUpdated(new Date());
    }
  }, [trackingData, matchedOrder]);

  // Check if search ID is a product ID
  const isProductId = trimmedSearchId.toUpperCase().startsWith("PROD-");
  const foundProduct = allProducts.find((p) => p.id === trimmedSearchId.toUpperCase());

  // Format destination address from order
  const getDestinationAddress = () => {
    if (matchedOrder?.shippingAddress) {
      const addr = matchedOrder.shippingAddress;
      return `${addr.city}, ${addr.state} - ${addr.zipCode}`;
    }
    return "Loading address...";
  };

  // Generate tracking events based on actual order status
  const generateTrackingEvents = () => {
    if (!matchedOrder) return [];

    const createdDate = matchedOrder.createdAt
      ? new Date(matchedOrder.createdAt)
      : new Date();

    const dest = getDestinationAddress();
    const currentStatus = matchedOrder.status?.toLowerCase();

    // Map each status to its active stage index
    const statusToActiveStage: { [key: string]: number } = {
      "placed": 0,      // ordered
      "pending_acceptance": 0, // ordered
      "accepted": 1,    // in-transit (processing)
      "confirmed": 1,   // in-transit
      "in-transit": 1,  // in-transit
      "shipped": 2,     // shipped
      "delivered": 3,   // delivered
      "cancelled": 0    // ordered
    };

    const activeStageIndex = statusToActiveStage[currentStatus] ?? 0;

    const statusMap: { [key: string]: any[] } = {
      "placed": [
        {
          id: "1",
          status: "ordered",
          location: "Order placed - Processing",
          timestamp: createdDate.toLocaleString(),
          metadata: "Order received and processing started",
          isActive: activeStageIndex === 0,
        }
      ],
      "pending_acceptance": [
        {
          id: "1",
          status: "ordered",
          location: "Order placed - Awaiting Supplier Acceptance",
          timestamp: createdDate.toLocaleString(),
          metadata: "Order assigned to supplier",
          isActive: activeStageIndex === 0,
        }
      ],
      "accepted": [
        {
          id: "1",
          status: "ordered",
          location: "Order placed - Processing",
          timestamp: createdDate.toLocaleString(),
          metadata: "Order confirmed",
          isActive: activeStageIndex === 0,
        },
        {
          id: "2",
          status: "in-transit",
          location: "Supplier Accepted Order",
          timestamp: new Date(createdDate.getTime() + 3600000).toLocaleString(),
          metadata: "Preparing for shipment",
          isActive: activeStageIndex === 1,
        }
      ],
      "confirmed": [
        {
          id: "1",
          status: "ordered",
          location: "Order placed - Processing",
          timestamp: createdDate.toLocaleString(),
          metadata: "Order confirmed and processing started",
          isActive: activeStageIndex === 0,
        },
        {
          id: "2",
          status: "in-transit",
          location: "Package dispatched to delivery hub",
          timestamp: new Date(createdDate.getTime() + 86400000).toLocaleString(),
          metadata: "Confirmed and ready for shipping",
          isActive: activeStageIndex === 1,
        }
      ],
      "in-transit": [
        {
          id: "1",
          status: "ordered",
          location: "Order placed - Processing",
          timestamp: createdDate.toLocaleString(),
          metadata: "Order confirmed and processing started",
          isActive: activeStageIndex === 0,
        },
        {
          id: "2",
          status: "in-transit",
          location: `Package in transit to ${dest}`,
          timestamp: new Date(createdDate.getTime() + 86400000).toLocaleString(),
          metadata: "Currently in transit",
          isActive: activeStageIndex === 1,
        },
        {
          id: "3",
          status: "shipped",
          location: `Arriving at ${dest}`,
          timestamp: new Date(createdDate.getTime() + 172800000).toLocaleString(),
          metadata: "Estimated delivery soon",
          isActive: activeStageIndex === 2,
        }
      ],
      "shipped": [
        {
          id: "1",
          status: "ordered",
          location: "Order placed - Processing",
          timestamp: createdDate.toLocaleString(),
          metadata: "Order confirmed",
          isActive: activeStageIndex === 0,
        },
        {
          id: "2",
          status: "in-transit",
          location: `Out for delivery to ${dest}`,
          timestamp: new Date(createdDate.getTime() + 86400000).toLocaleString(),
          metadata: "Shipped and on the way",
          isActive: activeStageIndex === 1,
        },
        {
          id: "3",
          status: "shipped",
          location: `Arriving at ${dest}`,
          timestamp: new Date(createdDate.getTime() + 172800000).toLocaleString(),
          metadata: "Expected delivery today",
          isActive: activeStageIndex === 2,
        }
      ],
      "delivered": [
        {
          id: "1",
          status: "ordered",
          location: "Order placed - Processing",
          timestamp: createdDate.toLocaleString(),
          metadata: "Order confirmed",
          isActive: activeStageIndex === 0,
        },
        {
          id: "2",
          status: "in-transit",
          location: "Package in transit",
          timestamp: new Date(createdDate.getTime() + 86400000).toLocaleString(),
          metadata: "Shipped and on the way",
          isActive: activeStageIndex === 1,
        },
        {
          id: "3",
          status: "delivered",
          location: `Delivered at ${dest}`,
          timestamp: new Date(createdDate.getTime() + 172800000).toLocaleString(),
          metadata: "Successfully delivered",
          isActive: activeStageIndex === 3,
        }
      ],
      "cancelled": [
        {
          id: "1",
          status: "ordered",
          location: "Order placed",
          timestamp: createdDate.toLocaleString(),
          metadata: "Order has been cancelled",
          isActive: true,
        }
      ]
    };

    return statusMap[currentStatus] || statusMap["placed"];
  };

  // Compute tracking events with proper memoization
  const trackingEvents = matchedOrder ? generateTrackingEvents() : (trackingData?.events || []);

  // Compute current location based on order status
  const getCurrentLocation = () => {
    const status = matchedOrder?.status?.toLowerCase();
    const dest = getDestinationAddress();

    if (status === "placed") return "Processing Center";
    if (status === "pending_acceptance") return "Awaiting Supplier Acceptance";
    if (status === "accepted") return "Supplier Accepted - Preparing";
    if (status === "confirmed") return "Mumbai Hub - Preparing";
    if (status === "in-transit") return "In Transit Hub";
    if (status === "shipped") return `En route to ${dest}`;
    if (status === "delivered") return `${dest}`;
    if (status === "cancelled") return "Cancelled";
    return "Tracking...";
  };

  // Get badge color based on status
  const getStatusBadgeColor = () => {
    const status = matchedOrder?.status?.toLowerCase();

    if (status === "placed") return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
    if (status === "pending_acceptance") return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
    if (status === "accepted") return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    if (status === "confirmed") return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    if (status === "in-transit") return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
    if (status === "shipped") return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400";
    if (status === "delivered") return "bg-green-500/10 text-green-700 dark:text-green-400";
    if (status === "cancelled") return "bg-red-500/10 text-red-700 dark:text-red-400";
    return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
  };

  const handleSearch = () => {
    const trimmed = searchId.trim();
    if (!trimmed) return;

    // Check if it's a product ID (PROD-XXX format)
    if (trimmed.toUpperCase().startsWith("PROD-")) {
      const product = allProducts.find((p) => p.id === trimmed.toUpperCase());
      if (product) {
        // Navigate to shop with product
        setLocation(`/loading?redirect=${encodeURIComponent(`/shop?scroll=${product.id}`)}`);
      } else {
        toast({
          title: "Product Not Found",
          description: `No product found with ID: ${trimmed}`,
          variant: "destructive",
        });
      }
    } else {
      // It's an order ID, show tracking
      setShowTracking(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-4xl font-bold mb-2">Track Product</h1>
        <p className="text-muted-foreground">Enter a Product ID to track your shipment in real-time</p>
      </div>

      <Card className="p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Enter Product ID (e.g., PROD-001) or Order ID (e.g., SCT-2024-001)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 text-lg"
              data-testid="input-product-id"
            />
          </div>
          <Button onClick={handleSearch} size="lg" data-testid="button-track">
            Search
          </Button>
        </div>
      </Card>

      {showTracking && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Shipment Timeline</h2>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 flex items-center gap-1" data-testid="badge-live-tracking">
                    <Radio className="h-3 w-3 animate-pulse" />
                    Live Tracking
                  </Badge>
                  <span className="text-xs text-muted-foreground" data-testid="text-last-updated">
                    Updated {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <TrackingTimeline events={trackingEvents} />
            </Card>
          </div>

          <div className="space-y-6">
            {/* Customer Destination Card - Prominent Display */}
            <Card className="p-6 bg-gradient-to-br from-primary/20 to-accent/10 border-primary/40">
              <div className="flex items-start gap-3">
                <MapPin className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Delivery Destination</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {matchedOrder?.shippingAddress
                      ? `${matchedOrder.shippingAddress.city}, ${matchedOrder.shippingAddress.state} - ${matchedOrder.shippingAddress.zipCode}`
                      : "Enter Order ID to view address"}
                  </p>
                  {matchedOrder?.customerName && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{matchedOrder.customerName}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Order Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Order ID</p>
                    <p className="font-mono font-medium">{matchedOrder?.orderId || trimmedSearchId}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Product Name</p>
                  <p className="font-medium">{matchedOrder?.productName || "Product"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={`${getStatusBadgeColor()} capitalize`} data-testid="badge-order-status">
                    {matchedOrder?.status || "In Transit"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Location</p>
                  <p className="font-medium">{getCurrentLocation()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="font-medium">{matchedOrder?.quantity || 1}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10">
              <h3 className="font-semibold mb-2">Blockchain Verified</h3>
              <p className="text-sm text-muted-foreground">
                All tracking events are recorded on the blockchain for immutable verification and transparency.
              </p>
            </Card>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
