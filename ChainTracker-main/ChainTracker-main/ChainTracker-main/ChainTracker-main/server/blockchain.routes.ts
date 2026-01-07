import type { Express } from "express";
import { storage } from "./storage";

export function registerBlockchainRoutes(app: Express, authMiddleware: any) {
  // Connect wallet
  app.post("/api/blockchain/connect-wallet", authMiddleware, async (req: any, res) => {
  try {
    const { walletAddress, chainId } = req.body;
    if (!walletAddress) return res.status(400).json({ error: "Wallet address required" });

    const userWallet = await storage.connectUserWallet(req.userId, walletAddress, chainId || 11155111);

    res.json({ success: true, wallet: userWallet });
  } catch (error: any) {
    console.error("Wallet connection error:", error);
    res.status(500).json({ error: error.message || "Failed to connect wallet" });
  }
});

  // Get user wallet
  app.get("/api/blockchain/wallet", authMiddleware, async (req: any, res) => {
  try {
    const wallet = await storage.getUserWallet(req.userId);
    if (!wallet) return res.status(404).json({ error: "Wallet not found" });

    res.json({ success: true, wallet });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

  // Disconnect wallet
  app.post("/api/blockchain/disconnect-wallet", authMiddleware, async (req: any, res) => {
  try {
    res.json({ success: true, message: "Wallet disconnected" });
  } catch (error: any) {
    console.error("Disconnect wallet error:", error);
    res.status(500).json({ error: error.message || "Failed to disconnect wallet" });
  }
});

  // Record blockchain transaction
  app.post("/api/blockchain/record-transaction", authMiddleware, async (req: any, res) => {
  try {
    const { orderId, transactionHash, functionName } = req.body;
    if (!transactionHash || !functionName) {
      return res.status(400).json({ error: "Transaction hash and function name required" });
    }

    const tx = await storage.recordBlockchainTransaction({
      userId: req.userId,
      orderId,
      transactionHash,
      functionName,
    });

    res.json({ success: true, transaction: tx });
  } catch (error: any) {
    console.error("Record transaction error:", error);
    res.status(500).json({ error: error.message || "Failed to record transaction" });
  }
});

  // Get transaction status
  app.get("/api/blockchain/transaction/:txHash", authMiddleware, async (req: any, res) => {
  try {
    const tx = await storage.getBlockchainTransaction(req.params.txHash);
    if (!tx) return res.status(404).json({ error: "Transaction not found" });

    res.json({ success: true, transaction: tx });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
});

  // Create order on blockchain
  app.post("/api/blockchain/create-order", authMiddleware, async (req: any, res) => {
  try {
    const { orderId, contractAddress, txHashCreated, escrowAmount } = req.body;
    if (!orderId || !contractAddress || !txHashCreated) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const orderBc = await storage.createOrderBlockchain({
      orderId,
      contractAddress,
      txHashCreated,
      escrowAmount,
    });

    res.json({ success: true, orderBlockchain: orderBc });
  } catch (error: any) {
    console.error("Create order blockchain error:", error);
    res.status(500).json({ error: error.message || "Failed to create order on blockchain" });
  }
  });
}
