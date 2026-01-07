import { Factory, Plus, Trash2, Mail, Phone, MoreVertical, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Manufacturer {
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
  senderEmail?: string;
  content: string;
  createdAt: string;
}

export default function Manufacturers() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [newManufacturer, setNewManufacturer] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    location: "",
  });

  // Fetch manufacturers
  const { data: manufacturers = [], isLoading, refetch } = useQuery<Manufacturer[]>({
    queryKey: ["/api/supplier/manufacturers"],
    refetchInterval: 2000,
    staleTime: 0,
    gcTime: 0,
  });

  // Add manufacturer mutation
  const addManufacturerMutation = useMutation({
    mutationFn: async (data: typeof newManufacturer) => {
      return await apiRequest("POST", "/api/supplier/manufacturers", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Manufacturer added successfully!",
      });
      setNewManufacturer({ name: "", email: "", phone: "", company: "", location: "" });
      setIsAddDialogOpen(false);
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add manufacturer",
        variant: "destructive",
      });
    },
  });

  // Delete manufacturer mutation
  const deleteManufacturerMutation = useMutation({
    mutationFn: async (manufacturerId: string) => {
      return await apiRequest("DELETE", `/api/supplier/manufacturers/${manufacturerId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Manufacturer removed successfully!",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove manufacturer",
        variant: "destructive",
      });
    },
  });

  // Send chat message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest("POST", "/api/supplier/manufacturers/chat", {
        manufacturerEmail: selectedManufacturer?.email,
        content: message,
      });
    },
    onSuccess: (data: any) => {
      setChatMessages([...chatMessages, data]);
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
    queryKey: ["/api/supplier/manufacturers/chat", selectedManufacturer?.email],
    enabled: isChatOpen && !!selectedManufacturer?.email,
    queryFn: async () => {
      if (!selectedManufacturer?.email) return [];
      const response = await apiRequest("GET", `/api/supplier/manufacturers/chat?manufacturerEmail=${encodeURIComponent(selectedManufacturer.email)}`);
      return response.json();
    },
    refetchInterval: 1500,
    staleTime: 0,
    gcTime: 0,
  });

  // Update messages when they change
  useEffect(() => {
    if (messages) {
      setChatMessages(messages);
    }
  }, [messages]);

  const handleAddManufacturer = () => {
    if (!newManufacturer.name || !newManufacturer.email) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }
    addManufacturerMutation.mutate(newManufacturer);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    sendMessageMutation.mutate(chatInput);
  };

  const filteredManufacturers = manufacturers.filter(
    (manufacturer) =>
      manufacturer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      manufacturer.email.toLowerCase().includes(searchQuery.toLowerCase())
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
          <Factory className="w-8 h-8" />
          Manufacturers
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your manufacturer network and relationships
        </p>
      </motion.div>

      {/* Search and Add */}
      <motion.div variants={itemVariants} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Search manufacturers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="zoom-pop text-sm h-9"
            data-testid="input-search-manufacturers"
          />
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="zoom-pop"
          size="sm"
          data-testid="button-add-manufacturer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Manufacturer
        </Button>
      </motion.div>

      {/* Manufacturers Table */}
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
                      Loading manufacturers...
                    </td>
                  </tr>
                ) : filteredManufacturers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No manufacturers found. Add one to get started!
                    </td>
                  </tr>
                ) : (
                  filteredManufacturers.map((manufacturer, index) => (
                    <motion.tr
                      key={manufacturer.id}
                      variants={itemVariants}
                      className="hover:bg-muted/30 transition-colors"
                      data-testid={`row-manufacturer-${manufacturer.id}`}
                    >
                      <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-3 font-medium">{manufacturer.name}</td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a
                          href={`mailto:${manufacturer.email}`}
                          className="text-primary hover:underline"
                          data-testid={`link-email-${manufacturer.id}`}
                        >
                          {manufacturer.email}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        {manufacturer.phone ? (
                          <span className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            {manufacturer.phone}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {manufacturer.company || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {manufacturer.location || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                data-testid={`button-menu-${manufacturer.id}`}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedManufacturer(manufacturer);
                                  setIsChatOpen(true);
                                  setChatMessages(messages);
                                }}
                                data-testid={`menu-contact-${manufacturer.id}`}
                              >
                                Contact
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteManufacturerMutation.mutate(manufacturer.id)}
                                className="text-destructive"
                                data-testid={`menu-delete-${manufacturer.id}`}
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

      {/* Add Manufacturer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Manufacturer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Manufacturer Name *</Label>
              <Input
                id="name"
                placeholder="Enter manufacturer name"
                value={newManufacturer.name}
                onChange={(e) => setNewManufacturer({ ...newManufacturer, name: e.target.value })}
                className="mt-1 text-sm h-8"
                data-testid="input-manufacturer-name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={newManufacturer.email}
                onChange={(e) => setNewManufacturer({ ...newManufacturer, email: e.target.value })}
                className="mt-1 text-sm h-8"
                data-testid="input-manufacturer-email"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="Enter phone number"
                value={newManufacturer.phone}
                onChange={(e) => setNewManufacturer({ ...newManufacturer, phone: e.target.value })}
                className="mt-1 text-sm h-8"
                data-testid="input-manufacturer-phone"
              />
            </div>
            <div>
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="Enter company name"
                value={newManufacturer.company}
                onChange={(e) => setNewManufacturer({ ...newManufacturer, company: e.target.value })}
                className="mt-1 text-sm h-8"
                data-testid="input-manufacturer-company"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Enter location"
                value={newManufacturer.location}
                onChange={(e) => setNewManufacturer({ ...newManufacturer, location: e.target.value })}
                className="mt-1 text-sm h-8"
                data-testid="input-manufacturer-location"
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                onClick={() => setIsAddDialogOpen(false)}
                variant="outline"
                size="sm"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddManufacturer}
                size="sm"
                disabled={addManufacturerMutation.isPending}
                data-testid="button-save-manufacturer"
              >
                {addManufacturerMutation.isPending ? "Adding..." : "Add Manufacturer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="max-w-md h-96 flex flex-col">
          <DialogHeader>
            <DialogTitle>Chat with {selectedManufacturer?.name}</DialogTitle>
          </DialogHeader>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 border rounded-md p-4 bg-muted/10">
            {messages && messages.length > 0 ? (
              messages.map((message) => {
                const isSupplier = message.senderEmail !== selectedManufacturer?.email;
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isSupplier ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${isSupplier
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

          {/* Chat Input */}
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
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
