import { Button } from "@/components/ui/button";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { Wallet, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function WalletConnectButton() {
  const { isConnected, address, balance, connectWallet, disconnectWallet, isConnecting } = useWalletConnection();

  if (!isConnected) {
    return (
      <Button
        onClick={connectWallet}
        disabled={isConnecting}
        variant="outline"
        size="sm"
        className="gap-2"
        data-testid="button-connect-wallet"
      >
        <Wallet className="w-4 h-4" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
  const displayBalance = balance ? parseFloat(balance).toFixed(3) : "0.000";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          data-testid="button-wallet-menu"
        >
          <Wallet className="w-4 h-4" />
          <span className="text-xs">{shortAddress}</span>
          <span className="text-xs text-muted-foreground">{displayBalance} ETH</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground">Connected Wallet</p>
          <p className="text-xs font-mono break-all">{address}</p>
        </div>
        <DropdownMenuItem
          onClick={disconnectWallet}
          className="text-red-600 gap-2"
          data-testid="button-disconnect-wallet"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
