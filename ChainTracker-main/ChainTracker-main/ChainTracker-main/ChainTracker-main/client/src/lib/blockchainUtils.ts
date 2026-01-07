import { ethers } from "ethers";

// Mock contract ABIs (replace with actual ABIs when deploying)
export const ORDER_MANAGEMENT_ABI = [
  "function createOrder(address supplier, uint256 amount, string memory productDetails) external",
  "function acceptOrder(uint256 orderId) external",
  "function shipOrder(uint256 orderId, string memory trackingInfo) external",
  "function deliverOrder(uint256 orderId) external",
];

export const PAYMENT_HANDLER_ABI = [
  "function depositEscrow(uint256 orderId, uint256 amount) external payable",
  "function releasePayment(uint256 orderId) external",
  "function claimPayment(uint256 orderId) external",
];

// Contract addresses (update with actual deployed addresses)
export const CONTRACT_ADDRESSES = {
  orderManagement: process.env.VITE_ORDER_MANAGEMENT_ADDRESS || "0x0000000000000000000000000000000000000000",
  paymentHandler: process.env.VITE_PAYMENT_HANDLER_ADDRESS || "0x0000000000000000000000000000000000000000",
};

export interface TransactionParams {
  to: string;
  data: string;
  value?: string;
}

export async function estimateGas(
  provider: ethers.BrowserProvider,
  params: TransactionParams
): Promise<string> {
  try {
    const gasEstimate = await provider.estimateGas({
      to: params.to,
      data: params.data,
      value: params.value,
    });
    return ethers.formatUnits(gasEstimate, "wei");
  } catch (error) {
    console.error("Gas estimation error:", error);
    throw new Error("Failed to estimate gas");
  }
}

export async function submitTransaction(
  provider: ethers.BrowserProvider,
  params: TransactionParams
): Promise<string> {
  try {
    const signer = await provider.getSigner();
    const tx = await signer.sendTransaction({
      to: params.to,
      data: params.data,
      value: params.value ? params.value : undefined,
    });

    return tx.hash;
  } catch (error: any) {
    if (error.code === "ACTION_REJECTED") {
      throw new Error("Transaction rejected by user");
    }
    throw new Error(error?.message || "Failed to submit transaction");
  }
}

export async function waitForTransaction(
  provider: ethers.BrowserProvider,
  txHash: string,
  confirmations: number = 1
): Promise<ethers.TransactionReceipt | null> {
  try {
    const receipt = await provider.waitForTransaction(txHash, confirmations);
    return receipt;
  } catch (error) {
    console.error("Transaction confirmation error:", error);
    return null;
  }
}

export async function getTransactionStatus(
  provider: ethers.BrowserProvider,
  txHash: string
): Promise<"pending" | "confirmed" | "failed"> {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) return "pending";
    return receipt.status === 1 ? "confirmed" : "failed";
  } catch (error) {
    return "pending";
  }
}
