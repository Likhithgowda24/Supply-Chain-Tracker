import { CustomerTable } from "@/components/CustomerTable";
import { Input } from "@/components/ui/input";
import { Search, X, MapPin, Mail, User } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch live customers from API
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
  });

  // Fetch all orders to get customer order details
  const { data: allOrders = [] } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const response = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Fetch all products
  const { data: allProducts = [] } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Fetch addresses for all customers
  const { data: allAddresses = [] } = useQuery({
    queryKey: ["/api/addresses"],
    queryFn: async () => {
      const response = await fetch("/api/addresses", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const filteredCustomers = customers.filter((c: any) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (customerId: string) => {
    const customer = customers.find((c: any) => c.id === customerId);
    if (customer) {
      const customerAddresses = allAddresses.filter((a: any) => a.userId === customerId);
      const addressString = customerAddresses.length > 0 
        ? `${customerAddresses[0].street}, ${customerAddresses[0].city}, ${customerAddresses[0].state} ${customerAddresses[0].zipCode}, ${customerAddresses[0].country}`
        : "No address on file";
      
      setSelectedCustomer({
        ...customer,
        address: addressString,
        orders: allOrders.filter((o: any) => o.userId === customerId),
      });
      setDetailsOpen(true);
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
        <h1 className="text-4xl font-bold mb-2">Customers</h1>
        <p className="text-muted-foreground">Manage your customer relationships and view their order history</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-customers"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      ) : (
        <>
          <CustomerTable
            customers={filteredCustomers}
            onViewDetails={handleViewDetails}
            onContact={(id) => console.log("Contact customer:", id)}
          />

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No customers found</p>
            </div>
          )}
        </>
      )}

      {/* Customer Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <Card className="p-6 bg-secondary/30">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <User className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Name</p>
                        <p className="text-lg font-semibold" data-testid="text-customer-name">
                          {selectedCustomer.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Email</p>
                        <p className="text-lg font-semibold" data-testid="text-customer-email">
                          {selectedCustomer.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Address Section */}
                  <div className="pt-4 border-t">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground font-semibold">Address</p>
                        <p className="text-sm font-medium" data-testid="text-customer-address">
                          {selectedCustomer.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Total Orders</p>
                      <p className="text-lg font-semibold text-primary" data-testid="text-customer-orders">
                        {selectedCustomer.totalOrders}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Joined</p>
                      <p className="text-lg font-semibold" data-testid="text-customer-joined">
                        {selectedCustomer.joinedDate}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Orders Section */}
              {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Order History</h3>
                  <div className="space-y-3">
                    {selectedCustomer.orders.map((order: any) => {
                      const product = allProducts.find(
                        (p: any) => p.productId === order.productId
                      );
                      const statusColors: Record<string, string> = {
                        "pending": "bg-yellow-500/20 text-yellow-700",
                        "confirmed": "bg-blue-500/20 text-blue-700",
                        "in-transit": "bg-purple-500/20 text-purple-700",
                        "processing": "bg-orange-500/20 text-orange-700",
                        "delivered": "bg-green-500/20 text-green-700",
                        "cancelled": "bg-red-500/20 text-red-700",
                        "placed": "bg-yellow-500/20 text-yellow-700",
                        "shipped": "bg-blue-500/20 text-blue-700",
                      };
                      return (
                        <Card key={order.id} className="p-4 border border-primary/20 bg-background/50">
                          <div className="space-y-3">
                            {/* Order ID */}
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground font-semibold">Order ID</p>
                                <p className="font-mono font-medium text-sm" data-testid={`text-order-id-${order.id}`}>
                                  {order.orderId}
                                </p>
                              </div>
                              <Badge className={statusColors[order.status] || "bg-secondary/50"} data-testid={`text-order-status-${order.id}`}>
                                {order.status}
                              </Badge>
                            </div>

                            {/* Product Information - Highlighted Box */}
                            <div className="bg-secondary/30 p-3 rounded-lg">
                              <p className="font-semibold text-foreground text-sm" data-testid={`text-order-product-${order.id}`}>
                                {product?.name || "Product"}
                              </p>
                              {product?.description && (
                                <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{product.description}</p>
                              )}
                              <p className="text-primary font-medium text-xs mt-1">₹{(product?.price || 0).toFixed(2)}</p>
                            </div>

                            {/* Order Details Grid */}
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs font-semibold">Quantity</p>
                                <p className="font-medium" data-testid={`text-order-qty-${order.id}`}>
                                  {order.quantity} units
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs font-semibold">Total</p>
                                <p className="font-bold text-primary" data-testid={`text-order-amount-${order.id}`}>
                                  ₹{parseFloat(order.totalPrice).toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs font-semibold">Date</p>
                                <p className="font-medium" data-testid={`text-order-date-${order.id}`}>
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No orders from this customer yet</p>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
