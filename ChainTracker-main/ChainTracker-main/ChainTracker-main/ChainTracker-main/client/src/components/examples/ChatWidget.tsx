import { ChatWidget } from "../ChatWidget";

const mockMessages = [
  {
    id: "1",
    sender: "customer" as const,
    content: "Hi, I need help tracking my order SCT-2024-001",
    timestamp: "10:30 AM",
  },
  {
    id: "2",
    sender: "admin" as const,
    content: "Hello! I'll help you with that. Let me check the status.",
    timestamp: "10:31 AM",
  },
  {
    id: "3",
    sender: "admin" as const,
    content: "Your order is currently in transit and expected to arrive by Dec 25.",
    timestamp: "10:32 AM",
  },
];

export default function ChatWidgetExample() {
  return (
    <div className="min-h-screen bg-background">
      <ChatWidget
        title="Support Chat"
        messages={mockMessages}
        onSendMessage={(msg) => console.log("Send:", msg)}
        onClose={() => console.log("Close chat")}
        onMinimize={() => console.log("Minimize chat")}
      />
    </div>
  );
}
