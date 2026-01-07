import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Clock, Send, User } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessage, SupportConversation } from "@shared/schema";

export default function Support() {
  const { toast } = useToast();
  const userRole = localStorage.getItem("role")?.toLowerCase() || "customer";
  const isCustomer = userRole === "customer" || userRole === "manufacturer" || userRole === "supplier";
  const [messageInput, setMessageInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Fetch conversation (for customers)
  const { data: conversation } = useQuery<SupportConversation>({
    queryKey: ["/api/support/conversation"],
    enabled: isCustomer,
  });

  // Fetch all conversations (for admins)
  const { data: allConversations = [] } = useQuery<SupportConversation[]>({
    queryKey: ["/api/support/conversations"],
    enabled: !isCustomer && userRole === "admin",
  });

  // Fetch messages for the selected conversation
  const conversationId = isCustomer ? conversation?.id : selectedConversationId;
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/support/messages", conversationId],
    enabled: !!conversationId,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", "/api/support/messages", {
        conversationId,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/messages", conversationId] });
      setMessageInput("");
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    sendMessageMutation.mutate(messageInput);
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isCustomer && allConversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(allConversations[0].id);
    }
  }, [allConversations, selectedConversationId, isCustomer]);

  if (isCustomer) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6 max-w-4xl mx-auto"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2">Support Chat</h1>
          <p className="text-muted-foreground">
            {userRole === "manufacturer" 
              ? "Contact support for assistance with your business" 
              : userRole === "supplier"
              ? "Contact support for assistance with your orders and inventory"
              : "Need help? Chat with our support team"}
          </p>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="bg-primary/5 p-4 border-b">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Live Support Chat</h3>
                <p className="text-xs text-muted-foreground">We'll respond as soon as possible</p>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[500px] p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No messages yet. Start a conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const userId = localStorage.getItem("userId");
                  const isOwnMessage = message.senderId === userId;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      data-testid={`message-${message.id}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-3 w-3" />
                          <span className="text-xs font-medium">
                            {isOwnMessage ? "You" : "Support Team"}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.createdAt!).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-muted/30">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                data-testid="input-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sendMessageMutation.isPending}
                data-testid="button-send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Admin view - show all conversations
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-4xl font-bold mb-2">Support Management</h1>
        <p className="text-muted-foreground">View and respond to customer support requests</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Conversations</h2>
          <ScrollArea className="h-[600px]">
            {allConversations.length === 0 ? (
              <Card className="p-6 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No conversations yet</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {allConversations.map((conv) => (
                  <Card
                    key={conv.id}
                    className={`p-4 hover-elevate cursor-pointer ${
                      selectedConversationId === conv.id ? "border-primary" : ""
                    }`}
                    onClick={() => setSelectedConversationId(conv.id)}
                    data-testid={`card-conversation-${conv.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{conv.subject}</h3>
                        <p className="text-xs text-muted-foreground">Customer ID: {conv.customerId.substring(0, 8)}</p>
                      </div>
                      <Badge className={conv.status === "open" ? "bg-green-500/10 text-green-700" : "bg-gray-500/10 text-gray-700"}>
                        {conv.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(conv.updatedAt!).toLocaleString()}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="lg:col-span-2">
          {selectedConversationId ? (
            <Card className="p-0 overflow-hidden">
              <div className="bg-primary/5 p-4 border-b">
                <h3 className="font-semibold">Conversation Messages</h3>
              </div>

              <ScrollArea className="h-[500px] p-4">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const userId = localStorage.getItem("userId");
                    const isOwnMessage = message.senderId === userId;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-3 w-3" />
                            <span className="text-xs font-medium">
                              {isOwnMessage ? "You (Admin)" : "Customer"}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.createdAt!).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-muted/30">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your response..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Select a conversation to view messages</p>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}
