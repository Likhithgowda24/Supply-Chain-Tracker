import { useState } from "react";
import { Bot, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  sender: "user" | "ai";
  content: string;
}

export function PrimeAIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      content: "👋 Hi! I'm Prime, your AI assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        sender: "user",
        content: input,
      };
      setMessages([...messages, userMessage]);
      
      setTimeout(() => {
        const responses = [
          "I can help you track shipments, manage orders, or explore supply chain features. What would you like to do?",
          "Based on your question, have you considered checking the tracking page or dashboard for real-time updates?",
          "I understand your concern. Here are 3 options: 1) Contact support, 2) Check order history, 3) Review tracking details.",
          "That's a great question! What specific aspect would help you most right now?",
        ];
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          content: responses[Math.floor(Math.random() * responses.length)],
        };
        setMessages((prev) => [...prev, aiResponse]);
      }, 1000);
      
      setInput("");
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 z-50"
          >
            <Card className="w-80 h-96 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary to-accent-foreground text-primary-foreground">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  <h3 className="font-semibold">Prime AI Assistant</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setIsOpen(false)}
                  data-testid="button-close-prime"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                      data-testid={`prime-message-${message.id}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    data-testid="input-prime-message"
                  />
                  <Button onClick={handleSend} size="icon" data-testid="button-send-prime">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="fixed bottom-4 right-4 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-primary to-accent-foreground"
          onClick={() => setIsOpen(!isOpen)}
          data-testid="button-toggle-prime"
        >
          <Bot className="h-6 w-6 text-primary-foreground" />
        </Button>
      </motion.div>
    </>
  );
}
