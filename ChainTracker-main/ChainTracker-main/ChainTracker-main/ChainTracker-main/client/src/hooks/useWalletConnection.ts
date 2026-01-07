import { useState, useCallback, useEffect } from "react";
import { useToast } from "./use-toast";
import { apiRequest } from "@/lib/queryClient";

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
}

export function useWalletConnection() {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    chainId: null,
    isConnecting: false,
    error: null,
  });
  
  const { toast } = useToast();

  // Restore wallet from database on component mount
  useEffect(() => {
    const restoreWallet = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return; // Not logged in

        const response = await apiRequest("GET", "/api/blockchain/wallet");
        const data = await response.json();
        
        if (data.success && data.wallet) {
          setWallet(prev => ({
            ...prev,
            isConnected: true,
            address: data.wallet.walletAddress,
            chainId: data.wallet.chainId || 11155111,
          }));
          
          // Also fetch balance from MetaMask if available
          if (typeof window !== "undefined" && (window as any).ethereum) {
            try {
              const ethereum = (window as any).ethereum;
              const balanceHex = await ethereum.request({
                method: "eth_getBalance",
                params: [data.wallet.walletAddress, "latest"],
              });
              const balanceEth = (Number(BigInt(balanceHex)) / 1e18).toFixed(4);
              setWallet(prev => ({ ...prev, balance: balanceEth }));
            } catch (err) {
              console.warn("Could not fetch balance:", err);
            }
          }
        }
      } catch (err) {
        console.log("No saved wallet found");
      }
    };

    restoreWallet();
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      if (typeof window === "undefined") {
        toast({ title: "Error", description: "Window not available", variant: "destructive" });
        return false;
      }

      if (!(window as any).ethereum) {
        toast({ title: "Error", description: "MetaMask not installed", variant: "destructive" });
        setWallet(prev => ({ ...prev, error: "MetaMask not installed" }));
        return false;
      }

      setWallet(prev => ({ ...prev, isConnecting: true }));

      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned");
      }

      const address = accounts[0];
      
      const balanceHex = await ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      });

      const balanceWei = BigInt(balanceHex);
      const balanceEth = (Number(balanceWei) / 1e18).toFixed(4);

      const chainIdHex = await ethereum.request({ method: "eth_chainId" });
      const chainId = parseInt(chainIdHex, 16);

      // Save wallet to database for persistence
      try {
        await apiRequest("POST", "/api/blockchain/connect-wallet", {
          walletAddress: address,
          chainId: chainId,
        });
      } catch (err) {
        console.warn("Could not save wallet to database:", err);
      }

      setWallet({
        isConnected: true,
        address,
        balance: balanceEth,
        chainId,
        isConnecting: false,
        error: null,
      });

      toast({ title: "Success", description: "Wallet connected!" });
      return true;
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to connect wallet";
      setWallet(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: errorMsg 
      }));
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
      return false;
    }
  }, [toast]);

  const disconnectWallet = useCallback(async () => {
    try {
      // Remove from database
      await apiRequest("POST", "/api/blockchain/disconnect-wallet", {});
    } catch (err) {
      console.warn("Could not remove wallet from database:", err);
    }

    setWallet({
      isConnected: false,
      address: null,
      balance: null,
      chainId: null,
      isConnecting: false,
      error: null,
    });

    toast({ title: "Success", description: "Wallet disconnected" });
  }, [toast]);

  const switchToSepolia = useCallback(async () => {
    try {
      if (typeof window === "undefined" || !(window as any).ethereum) return false;

      const ethereum = (window as any).ethereum;
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
      
      toast({ title: "Success", description: "Switched to Sepolia" });
      return true;
    } catch (err: any) {
      if (err.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0xaa36a7",
              chainName: "Sepolia",
              rpcUrls: ["https://sepolia.infura.io/v3/"],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            }],
          });
          toast({ title: "Success", description: "Sepolia added" });
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }, [toast]);

  return {
    isConnected: wallet.isConnected,
    address: wallet.address,
    balance: wallet.balance,
    chainId: wallet.chainId,
    isConnecting: wallet.isConnecting,
    error: wallet.error,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
  };
}
