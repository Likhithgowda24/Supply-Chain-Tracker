import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./ThemeToggle";
import { BackgroundToggle } from "./BackgroundToggle";
import { NotificationBell } from "./NotificationBell";
import { WalletConnectButton } from "./WalletConnectButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Link } from "wouter";
import { useTheme } from "./ThemeProvider";
import { useState, useRef } from "react";

interface TopBarProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  notifications: any[];
  onSearch?: (query: string) => void;
  onLogout?: () => void;
  onNotificationClick?: (notification: any) => void;
}

export function TopBar({ user, notifications, onSearch, onLogout, onNotificationClick }: TopBarProps) {
  const { isAnimatedBg, setIsAnimatedBg } = useTheme();
  const [isProfilePressed, setIsProfilePressed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleProfileMouseDown = () => {
    setIsProfilePressed(true);
  };

  const handleProfileMouseUp = () => {
    timeoutRef.current = setTimeout(() => {
      setIsProfilePressed(false);
    }, 100);
  };

  const handleProfileMouseLeave = () => {
    setIsProfilePressed(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b bg-background px-6 py-3">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger className="zoom-pop" data-testid="button-sidebar-toggle" />
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by Product ID or Name..."
            className="pl-10 zoom-pop"
            onChange={(e) => onSearch?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const query = e.currentTarget.value;
                if (query.trim()) {
                  window.location.href = `/shop?search=${encodeURIComponent(query)}`;
                }
              }
            }}
            data-testid="input-search"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="nav-item">
          <WalletConnectButton />
        </div>
        <div className="nav-item">
          <BackgroundToggle isAnimated={isAnimatedBg} onToggle={setIsAnimatedBg} />
        </div>
        <div className="nav-item">
          <ThemeToggle />
        </div>
        <div className="nav-item">
          <NotificationBell
            notifications={notifications}
            onNotificationClick={(notification) => onNotificationClick?.(notification)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`flex items-center gap-2 rounded-full p-1 transition-all duration-300 nav-item ${isProfilePressed ? "scale-110 brightness-150" : "hover:scale-105"
                }`}
              style={{
                boxShadow: isProfilePressed
                  ? "0 0 60px rgba(147, 51, 234, 1), 0 0 120px rgba(245, 158, 11, 0.8), inset 0 0 20px rgba(147, 51, 234, 0.5)"
                  : "0 0 30px rgba(147, 51, 234, 0.5), 0 0 60px rgba(245, 158, 11, 0.3)",
              }}
              onMouseDown={handleProfileMouseDown}
              onMouseUp={handleProfileMouseUp}
              onMouseLeave={handleProfileMouseLeave}
              data-testid="button-profile"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" data-testid="link-profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" data-testid="link-settings-menu">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onLogout}
              data-testid="button-logout"
              className="text-destructive"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
