import { Users, Plus, Trash2, Mail, Phone, MoreVertical, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  location?: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  content: string;
  createdAt: string;
}

interface AssignedOrder {
  orderId: string;
  productName: string;
  customerName: string;
  quantity: number;
  totalPrice: number;
  status: string;
  assignedAt: string;
  productPrice: number | string;
}

export default function Suppliers() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [selectedTab, setSelectedTab] = useState<"chat" | "orders">("chat");
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    location: "",
  });

  // Fetch suppliers
  const { data: suppliers = [], isLoading, refetch } = useQuery<Supplier[]>({
    queryKey: ["/api/manufacturer/suppliers"],
    refetchInterval: 2000,
    staleTime: 0,
    gcTime: 0,
  });

  // Add supplier mutation
  const addSupplierMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/manufacturer/suppliers", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier added successfully!",
      });
      setNewSupplier({ name: "", email: "", phone: "", company: "", location: "" });
      setIsAddDialogOpen(false);
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add supplier",
        variant: "destructive",
      });
    },
  });

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      return await apiRequest("DELETE", `/api/manufacturer/suppliers/${supplierId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier removed successfully!",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove supplier",
        variant: "destructive",
      });
    },
  });

  // Send chat message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest("POST", "/api/supplier/chat", {
        supplierEmail: selectedSupplier?.email,
        content: message,
      });
    },
    onSuccess: (data: any) => {
      if (data && data.id) {
        setChatMessages([...chatMessages, data]);
      }
      setChatInput("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Fetch chat messages
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/supplier/chat", selectedSupplier?.email],
    enabled: isChatOpen && !!selectedSupplier?.email && selectedTab === "chat",
    queryFn: async () => {
      if (!selectedSupplier?.email) return [];
      const response = await apiRequest("GET", `/api/supplier/chat?supplierEmail=${encodeURIComponent(selectedSupplier.email)}`);
      return response.json();
    },
    refetchInterval: 1500,
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch assigned orders for supplier
  const { data: assignedOrders = [] } = useQuery<AssignedOrder[]>({
    queryKey: ["/api/manufacturer/supplier-orders", selectedSupplier?.id],
    enabled: isChatOpen && !!selectedSupplier?.id && selectedTab === "orders",
    queryFn: async () => {
      if (!selectedSupplier?.id) return [];
      try {
        const response = await apiRequest("GET", `/api/manufacturer/supplier-orders/${selectedSupplier.id}`);
        const data = Array.isArray(response) ? response : await response.json();
        return data || [];
      } catch (error) {
        console.error("Error fetching assigned orders:", error);
        return [];
      }
    },
    refetchInterval: 2000,
    staleTime: 0,
    gcTime: 0,
  });

  // Update messages when they change
  useEffect(() => {
    setChatMessages(messages);
  }, [messages]);

  const handleAddSupplier = () => {
    if (!newSupplier.name || !newSupplier.email) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }
    addSupplierMutation.mutate(newSupplier);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    sendMessageMutation.mutate(chatInput);
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, ease: "easeInOut", staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-1">
        <h1 className="text-3xl font-bold glowing-text flex items-center gap-2">
          <Users className="w-8 h-8" />
          Suppliers
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your supplier network and relationships
        </p>
      </motion.div>

      {/* Search and Add */}
      <motion.div variants={itemVariants} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Search suppliers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="zoom-pop text-sm h-9"
            data-testid="input-search-suppliers"
          />
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="zoom-pop"
          size="sm"
          data-testid="button-add-supplier"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </motion.div>

      {/* Suppliers Table */}
      <motion.div variants={itemVariants}>
        <Card className="glowing-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Sl No.</th>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold">Company</th>
                  <th className="px-4 py-3 text-left font-semibold">Location</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Loading suppliers...
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No suppliers found. Add one to get started!
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier, index) => (
                    <motion.tr
                      key={supplier.id}
                      variants={itemVariants}
                      className="hover:bg-muted/30 transition-colors"
                      data-testid={`row-supplier-${supplier.id}`}
                    >
                      <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-3 font-medium">{supplier.name}</td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a
                          href={`mailto:${supplier.email}`}
                          className="text-primary hover:underline"
                          data-testid={`link-email-${supplier.id}`}
                        >
                          {supplier.email}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        {supplier.phone ? (
                          <span className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            {supplier.phone}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {supplier.company || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {supplier.location || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                data-testid={`button-menu-${supplier.id}`}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedSupplier(supplier);
                                  setIsChatOpen(true);
                                  setChatMessages(messages);
                                }}
                                data-testid={`menu-contact-${supplier.id}`}
                              >
                                Contact
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteSupplierMutation.mutate(supplier.id)}
                                className="text-destructive"
                                data-testid={`menu-delete-${supplier.id}`}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Add Supplier Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm">
                Name *
              </Label>
              <Input
                id="name"
                placeholder="Supplier name"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                className="zoom-pop text-sm h-8 mt-1"
                data-testid="input-supplier-name"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="supplier@example.com"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                className="zoom-pop text-sm h-8 mt-1"
                data-testid="input-supplier-email"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm">
                Phone
              </Label>
              <Input
                id="phone"
                placeholder="+1 (555) 000-0000"
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                className="zoom-pop text-sm h-8 mt-1"
                data-testid="input-supplier-phone"
              />
            </div>

            <div>
              <Label htmlFor="company" className="text-sm">
                Company
              </Label>
              <Input
                id="company"
                placeholder="Company name"
                value={newSupplier.company}
                onChange={(e) => setNewSupplier({ ...newSupplier, company: e.target.value })}
                className="zoom-pop text-sm h-8 mt-1"
                data-testid="input-supplier-company"
              />
            </div>

            <div>
              <Label htmlFor="location" className="text-sm">
                Location
              </Label>
              <Input
                id="location"
                placeholder="City, Country"
                value={newSupplier.location}
                onChange={(e) => setNewSupplier({ ...newSupplier, location: e.target.value })}
                className="zoom-pop text-sm h-8 mt-1"
                data-testid="input-supplier-location"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                size="sm"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSupplier}
                size="sm"
                disabled={addSupplierMutation.isPending}
                data-testid="button-save-supplier"
              >
                {addSupplierMutation.isPending ? "Adding..." : "Add Supplier"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat/Orders Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="max-w-2xl max-h-screen flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedSupplier?.name}</DialogTitle>
            <DialogDescription>{selectedSupplier?.email}</DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setSelectedTab("chat")}
              className={`px-4 py-2 text-sm font-medium transition ${selectedTab === "chat"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
                }`}
              data-testid="tab-chat"
            >
              Messages
            </button>
            <button
              onClick={() => setSelectedTab("orders")}
              className={`px-4 py-2 text-sm font-medium transition ${selectedTab === "orders"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
                }`}
              data-testid="tab-orders"
            >
              Assigned Orders ({assignedOrders.length})
            </button>
          </div>

          {/* Chat Tab */}
          {selectedTab === "chat" && (
            <div className="flex-1 flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 border rounded-md p-4 bg-muted/10">
                {messages && messages.length > 0 ? (
                  messages.map((message) => {
                    const isManufacturer = message.senderEmail !== selectedSupplier?.email;
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isManufacturer ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${isManufacturer
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-muted text-muted-foreground rounded-bl-none"
                            }`}
                        >
                          <p className="text-xs font-semibold opacity-75 mb-1">{message.senderName}</p>
                          <p className="text-sm break-words">{message.content}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No messages yet. Start a conversation!
                  </p>
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="text-sm h-9"
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  disabled={sendMessageMutation.isPending || !chatInput.trim()}
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {selectedTab === "orders" && (
            <div className="flex-1 overflow-y-auto">
              {assignedOrders && assignedOrders.length > 0 ? (
                <div className="space-y-3">
                  {assignedOrders.map((order) => (
                    <div key={order.orderId} className="p-3 bg-secondary/10 border border-secondary/30 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{order.orderId}</p>
                          <p className="text-xs text-primary">{order.productName}</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-700 rounded">
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs space-y-1 text-muted-foreground">
                        <p><span className="font-semibold">Customer:</span> {order.customerName}</p>
                        <p><span className="font-semibold">Qty:</span> {order.quantity} @ ₹{(typeof order.productPrice === 'number' ? order.productPrice : parseFloat(String(order.productPrice || 0))).toFixed(2)}</p>
                        <p className="font-semibold text-primary">Total: ₹{(typeof order.totalPrice === 'number' ? order.totalPrice : parseFloat(String(order.totalPrice || 0))).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No orders assigned to this supplier yet
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
