import { TopBar } from "../TopBar";
import { ThemeProvider } from "../ThemeProvider";
import { SidebarProvider } from "@/components/ui/sidebar";

const mockUser = {
  name: "likhithgowda581",
  email: "likhithgowda263@gmail.com",
};

const mockNotifications = [
  {
    id: "1",
    type: "order" as const,
    title: "New Order",
    message: "Order placed",
    time: "2 min ago",
    read: false,
  },
];

export default function TopBarExample() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <div className="h-screen w-full">
          <TopBar
            user={mockUser}
            notifications={mockNotifications}
            onSearch={(query) => console.log("Search:", query)}
            onLogout={() => console.log("Logout")}
          />
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
