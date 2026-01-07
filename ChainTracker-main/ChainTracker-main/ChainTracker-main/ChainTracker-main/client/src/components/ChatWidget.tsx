import { useState } from "react";
import { Send, X, Minimize2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  sender: "user" | "customer" | "admin";
  content: string;
  timestamp: string;
}

interface ChatWidgetProps {
  title: string;
  messages: Message[];
  onSendMessage?: (message: string) => void;
  onClose?: () => void;
  onMinimize?: () => void;
}

export function ChatWidget({ title, messages, onSendMessage, onClose, onMinimize }: ChatWidgetProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage?.(input);
      setInput("");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className="w-96 h-[600px] flex flex-col shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">{title}</h3>
            <div className="flex items-center gap-1">
              {onMinimize && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMinimize} data-testid="button-minimize-chat">
                  <Minimize2 className="h-4 w-4" />
                </Button>
              )}
              {onClose && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} data-testid="button-close-chat">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-2 ${
                    message.sender === "user" ? "flex-row-reverse" : ""
                  }`}
                  data-testid={`message-${message.id}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.sender === "user" ? "U" : message.sender === "admin" ? "A" : "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                data-testid="input-chat-message"
              />
              <Button onClick={handleSend} data-testid="button-send-message">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
