# MetaMask Integration Guide for Supply Chain Tracker

## Overview

This document provides comprehensive details for integrating MetaMask wallet functionality into the Supply Chain Tracker application for blockchain-based transactions across all user roles.

---

## 1. Architecture Overview

### Technology Stack
- **Wallet Connection**: MetaMask (via ethers.js or Web3.js)
- **Blockchain**: Ethereum (or compatible networks like Polygon, Sepolia testnet)
- **Smart Contracts**: Solidity (for order management, shipping, and payment contracts)
- **Frontend Library**: ethers.js v6 (recommended)
- **Backend Integration**: Express.js endpoints to verify transactions and update database

### Key Components
1. **Wallet Connection Manager** - Detects and connects MetaMask
2. **Transaction Handler** - Executes blockchain transactions
3. **Contract Interaction Layer** - Communicates with smart contracts
4. **Backend Verification** - Validates transactions and syncs with database

---

## 2. Smart Contracts Required

### 2.1 OrderManagement.sol
```solidity
Purpose: Manage manufacturer-to-supplier orders on blockchain

Key Functions:
- createOrder(supplierId, amount, productDetails) - Manufacturer creates order
- acceptOrder(orderId) - Supplier accepts (first to accept wins)
- shipOrder(orderId, trackingInfo) - Supplier marks as shipped
- deliverOrder(orderId) - Customer confirms delivery
- refundOrder(orderId) - Refund if issues occur

Events:
- OrderCreated(orderId, manufacturerId, supplierId, amount)
- OrderAccepted(orderId, supplierId)
- OrderShipped(orderId, shipmentLedgerId)
- OrderDelivered(orderId, timestamp)
```

### 2.2 PaymentHandler.sol
```solidity
Purpose: Handle payments and escrow for transactions

Key Functions:
- depositEscrow(orderId, amount) - Customer deposits funds
- releasePayment(orderId) - Release payment to supplier after delivery
- handleRefund(orderId) - Process refunds
- claimPayment(orderId) - Supplier claims earned payment

Events:
- DepositCreated(orderId, customerId, amount)
- PaymentReleased(orderId, supplierId, amount)
- RefundProcessed(orderId, customerId, amount)
```

### 2.3 ShipmentLedger.sol
```solidity
Purpose: Immutable shipment tracking on blockchain

Key Functions:
- recordShipment(orderId, trackingData) - Log shipment details
- updateLocation(shipmentId, location, timestamp) - Update shipment location
- verifyDelivery(shipmentId, signature) - Verify delivery with proof
- getShipmentHistory(shipmentId) - Retrieve full tracking history

Events:
- ShipmentRecorded(shipmentId, orderId, timestamp)
- LocationUpdated(shipmentId, location, timestamp)
- DeliveryVerified(shipmentId, timestamp)
```

---

## 3. Role-Based Transaction Flows

### 3.1 Manufacturer (Order Creator)
**Wallet Functions:**
- Connect wallet and view balance
- Create order (triggers OrderManagement.createOrder)
- Lock funds in smart contract for order amount
- Monitor supplier responses
- Receive notifications when order is accepted/shipped

**Transaction Flow:**
```
1. Manufacturer connects MetaMask wallet
2. Selects supplier and enters order details
3. Frontend prepares transaction data
4. MetaMask prompts for approval
5. Transaction sent to OrderManagement.createOrder
6. Funds transferred to contract escrow
7. Backend listens for event and updates database with blockchain tx hash
8. Order status updated to "pending_acceptance"
```

**Key Endpoints:**
- POST /api/blockchain/create-order (validates and sends tx)
- GET /api/blockchain/order-status/:orderId (fetches from blockchain)

---

### 3.2 Supplier (Order Acceptor)
**Wallet Functions:**
- Connect wallet and view balance
- View available orders
- Accept order (first to accept gets exclusive access)
- Upload shipment proof (transaction on blockchain)
- Receive payment upon delivery confirmation

**Transaction Flow:**
```
1. Supplier connects MetaMask wallet
2. Views pending orders with their details
3. Clicks "Accept Order" → triggers smart contract transaction
4. MetaMask prompts for approval (no fund transfer, just acceptance)
5. acceptOrder() executes on blockchain
6. Order locked to this supplier (other suppliers can't accept)
7. Backend receives order accepted event
8. Supplier updates status to "accepted"
9. Supplier can now proceed with shipment
10. Records shipment: shipOrder() transaction on OrderManagement
11. Upon customer delivery confirmation: payment released via PaymentHandler.releasePayment()
```

**Key Endpoints:**
- GET /api/blockchain/pending-orders (lists available orders)
- POST /api/blockchain/accept-order/:orderId (executes acceptance tx)
- POST /api/blockchain/mark-shipped/:orderId (records shipment)
- POST /api/blockchain/claim-payment/:orderId (supplier claims payment)

---

### 3.3 Customer (Order Recipient)
**Wallet Functions:**
- Connect wallet and view balance
- Deposit funds for orders (escrow)
- Confirm receipt of delivery
- Release payment to supplier (triggers payment transfer)
- Dispute/refund if issues occur

**Transaction Flow:**
```
1. Customer connects MetaMask wallet
2. Browses products and places order
3. Order created by manufacturer (customer already in contract)
4. Customer sees order in dashboard
5. Deposits escrow funds: depositEscrow() on PaymentHandler
6. MetaMask shows transaction fee and asks for approval
7. Customer funds locked in smart contract
8. Waits for supplier to accept and ship
9. Receives shipment notification with tracking
10. Upon delivery: confirmDelivery() on OrderManagement
11. Payment automatically released to supplier via PaymentHandler.releasePayment()
12. Transaction hash recorded in database
```

**Key Endpoints:**
- POST /api/blockchain/deposit-escrow/:orderId (deposit funds)
- POST /api/blockchain/confirm-delivery/:orderId (confirm receipt)
- POST /api/blockchain/dispute-order/:orderId (initiate refund)
- GET /api/blockchain/escrow-balance (view locked funds)

---

### 3.4 Admin (Overseer)
**Wallet Functions:**
- Connect wallet with admin privileges
- Monitor all transactions across platform
- Execute emergency refunds (multi-sig if needed)
- Update contract parameters
- View transaction history and audit logs

**Transaction Flow:**
```
1. Admin connects MetaMask wallet
2. Verifies admin privileges via backend
3. Views dashboard with all active orders and transactions
4. Can trigger emergency refunds: handleRefund() on PaymentHandler
5. Access to detailed transaction logs
6. Ability to pause contracts if issues detected (if pausable pattern used)
7. Monitor gas costs and transaction statuses
```

**Key Endpoints:**
- GET /api/blockchain/all-transactions (admin only)
- POST /api/blockchain/emergency-refund/:orderId (admin only)
- GET /api/blockchain/gas-analytics (admin only)

---

## 4. Frontend Implementation Details

### 4.1 Wallet Connection Component
```typescript
// Location: client/src/hooks/useWalletConnection.ts

Hook Functions:
- connectWallet() - Request MetaMask connection
- disconnectWallet() - Disconnect user
- getBalance() - Fetch wallet balance
- switchNetwork(chainId) - Switch Ethereum network
- checkWalletPermissions() - Verify required permissions
- getConnectedAddress() - Get current wallet address

State Management:
- isConnected: boolean
- walletAddress: string | null
- balance: string
- chainId: number
- networkName: string
- isConnecting: boolean
```

### 4.2 Transaction Handler Component
```typescript
// Location: client/src/hooks/useBlockchainTransaction.ts

Hook Functions:
- sendTransaction(contractAddress, abi, functionName, params, value)
- estimateGas(contractAddress, abi, functionName, params)
- waitForTransaction(txHash, confirmations)
- handleTransactionError(error)

Features:
- Real-time gas estimation
- Automatic retry logic for failed transactions
- Transaction status polling
- Error handling with user-friendly messages
- MetaMask rejection handling
```

### 4.3 UI Components for Each Role

**For Manufacturers:**
```typescript
// client/src/components/ManufacturerOrderCreation.tsx
- Wallet balance display
- Order form with MetaMask interaction
- Gas fee estimate display
- Transaction confirmation modal
- Order status tracking with tx hash link
```

**For Suppliers:**
```typescript
// client/src/components/SupplierOrderAcceptance.tsx
- Available orders list
- One-click accept with MetaMask confirmation
- Accepted orders dashboard
- Ship order form with blockchain recording
- Payment claim interface
```

**For Customers:**
```typescript
// client/src/components/CustomerEscrowManagement.tsx
- Wallet balance and escrow balance display
- Deposit escrow form
- Active orders with delivery confirmation button
- Payment tracking
- Dispute/refund interface
```

### 4.4 Environment Variables Needed
```
VITE_CONTRACT_ORDER_ADDRESS=0x... (OrderManagement.sol address)
VITE_CONTRACT_PAYMENT_ADDRESS=0x... (PaymentHandler.sol address)
VITE_CONTRACT_SHIPMENT_ADDRESS=0x... (ShipmentLedger.sol address)
VITE_ETHEREUM_NETWORK=sepolia|mainnet|polygon
VITE_ETHERSCAN_API_KEY=... (for transaction verification)
```

---

## 5. Backend Integration Points

### 5.1 Database Schema Changes
```typescript
// shared/schema.ts additions

walletTransactions table:
- id: string (primary key)
- userId: string (foreign key)
- transactionHash: string
- blockNumber: number
- gasUsed: string
- gasPrice: string
- functionName: string (createOrder, acceptOrder, etc.)
- status: enum ('pending', 'confirmed', 'failed')
- createdAt: timestamp
- updatedAt: timestamp

userWallets table:
- id: string (primary key)
- userId: string (foreign key)
- walletAddress: string (unique)
- chainId: number
- verifiedAt: timestamp
- isDefault: boolean

orderBlockchain table:
- id: string (primary key)
- orderId: string (foreign key)
- contractAddress: string
- transactionHashCreated: string
- transactionHashAccepted: string | null
- transactionHashShipped: string | null
- transactionHashDelivered: string | null
- escrowAmount: decimal
- escrowStatus: enum ('pending', 'locked', 'released', 'refunded')
```

### 5.2 New API Endpoints

**Authentication & Verification:**
```
POST /api/blockchain/verify-wallet
- Body: { walletAddress, signature, message }
- Returns: verification token

GET /api/blockchain/wallet-status
- Auth required
- Returns: { walletAddress, balance, chainId, isVerified }
```

**Transaction Management:**
```
POST /api/blockchain/create-order
- Body: { orderId, contractData, gasLimit }
- Returns: { transactionHash, status }

POST /api/blockchain/accept-order/:orderId
- Auth required (supplier)
- Returns: { transactionHash, status }

POST /api/blockchain/listen-to-events
- Listens for blockchain events and updates database
- Webhook or polling mechanism

POST /api/blockchain/confirm-transaction
- Body: { transactionHash, orderId, functionName }
- Returns: { confirmed, blockNumber, gasUsed }
```

### 5.3 Event Listener Service
```typescript
// server/services/blockchainEventListener.ts

Features:
- Listen to OrderCreated events from blockchain
- Listen to OrderAccepted events
- Listen to OrderShipped events
- Listen to PaymentReleased events
- Listen to DeliveryVerified events
- Update database records when events occur
- Send notifications to relevant users
- Handle contract errors and retries

Implementation:
- Use ethers.js to monitor contract events
- Continuous polling or WebSocket connection to RPC
- Event cache to prevent duplicate processing
- Database transaction logging
```

### 5.4 Transaction Verification Service
```typescript
// server/services/transactionVerifier.ts

Features:
- Verify transaction was mined on blockchain
- Check transaction parameters match database records
- Calculate and verify gas costs
- Detect failed transactions
- Provide transaction receipt details
- Enable transaction history export

Methods:
- verifyTransactionMined(txHash)
- getTransactionReceipt(txHash)
- validateTransactionData(txHash, expectedData)
- checkTransactionStatus(orderId)
```

---

## 6. Security Considerations

### 6.1 Wallet Security
```
✓ Use ethers.js built-in wallet security
✓ Never store private keys on backend
✓ Implement wallet signature verification
✓ Use message signing for user authentication
✓ Implement nonce system for replay attack prevention
✓ Verify contract addresses before transactions
```

### 6.2 Smart Contract Security
```
✓ Use OpenZeppelin libraries for battle-tested contracts
✓ Implement reentrancy guards
✓ Use SafeMath for arithmetic operations
✓ Implement access control (roles)
✓ Add circuit breaker (pause functionality)
✓ Implement fund recovery mechanisms
✓ External audit recommended before mainnet deployment
```

### 6.3 Transaction Security
```
✓ Implement transaction timeout (auto-cancel after 30 minutes)
✓ Verify gas prices aren't abnormally high
✓ Implement transaction replacement with higher gas
✓ Log all transactions for audit trail
✓ Use contract events as source of truth
✓ Implement database transaction consistency
```

### 6.4 Rate Limiting & DoS Prevention
```
✓ Limit wallet connections per user
✓ Rate limit transaction submissions
✓ Implement cooldown between transactions
✓ Validate all transaction parameters
✓ Implement request signing to prevent replay
```

---

## 7. Network Configuration

### Supported Networks
```
Development:
- Sepolia Testnet (recommended for testing)
- Mumbai (Polygon testnet)
- Hardhat local network

Production:
- Ethereum Mainnet (high gas costs)
- Polygon Mainnet (low gas, fast)
- Other EVM-compatible chains
```

### Network Configuration in Code
```typescript
// shared/config.ts

const NETWORKS = {
  sepolia: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: process.env.VITE_SEPOLIA_RPC_URL,
    explorerUrl: 'https://sepolia.etherscan.io'
  },
  polygon: {
    name: 'Polygon Mainnet',
    chainId: 137,
    rpcUrl: process.env.VITE_POLYGON_RPC_URL,
    explorerUrl: 'https://polygonscan.com'
  }
}
```

---

## 8. Gas & Cost Management

### Gas Optimization Strategies
```
1. Batch operations when possible
2. Use events instead of storage for logging
3. Implement contract upgrades for bug fixes
4. Cache frequently-accessed data
5. Use packed storage for related variables
```

### Cost Breakdown (Example - Sepolia Testnet)
```
Create Order: ~200,000 gas
Accept Order: ~150,000 gas
Mark Shipped: ~120,000 gas
Confirm Delivery: ~180,000 gas
Release Payment: ~200,000 gas

Average Gas Price (Sepolia): ~1-5 Gwei
Total Cost per Full Transaction Flow: ~$0.01-0.10 (testnet)
```

---

## 9. Error Handling & Recovery

### Common Errors & Solutions
```
MetaMask Not Installed
- Display helpful message with download link
- Provide fallback payment method

User Rejected Transaction
- Log rejection
- Allow user to retry
- Don't spam with requests

Insufficient Funds
- Check balance before transaction
- Display required amount
- Suggest where to get funds

Network Mismatch
- Detect current network
- Prompt to switch networks
- Show required network info

Transaction Failed
- Retry with higher gas price
- Log transaction hash for debugging
- Notify user with clear message
```

---

## 10. Testing Strategy

### Unit Tests
```
✓ Wallet connection logic
✓ Transaction parameter validation
✓ Gas estimation calculations
✓ Error handling functions
✓ Event parsing logic
```

### Integration Tests
```
✓ MetaMask wallet connection
✓ Contract interaction (testnet)
✓ Transaction submission and confirmation
✓ Database synchronization after blockchain events
✓ Multi-step order flow (create → accept → ship → deliver)
```

### Smart Contract Tests (Hardhat)
```
✓ Order creation and state changes
✓ Supplier acceptance and exclusivity
✓ Payment release conditions
✓ Refund mechanisms
✓ Access control and permissions
✓ Edge cases and boundary conditions
```

---

## 11. Deployment Checklist

Before Mainnet Deployment:
- [ ] Smart contracts audited by security firm
- [ ] Testnet deployment successful with full flow
- [ ] All error cases handled gracefully
- [ ] Gas optimization completed
- [ ] Rate limiting and DoS protection implemented
- [ ] User documentation written
- [ ] MetaMask network configured in production
- [ ] Database schema migrations tested
- [ ] Transaction logging and monitoring active
- [ ] Disaster recovery plan documented
- [ ] Admin emergency functions tested

---

## 12. User Documentation Sections Needed

### For Manufacturers
- How to connect MetaMask wallet
- How to create blockchain-backed orders
- Understanding gas fees
- Viewing order status and blockchain tx links
- Canceling orders and refund process

### For Suppliers
- Wallet setup and balance check
- How to accept orders
- Uploading proof of shipment
- Claiming payments
- Understanding commission/fees

### For Customers
- Wallet setup
- How escrow works
- Depositing funds safely
- Confirming delivery
- Disputing orders

### For Admins
- Monitoring blockchain transactions
- Emergency refund procedures
- Contract management
- Network switching
- Transaction history export

---

## 13. Monitoring & Analytics

### Metrics to Track
```
- Total transactions processed
- Average gas costs
- Failed transaction rate
- Average transaction confirmation time
- Active wallet count
- Total value locked in contracts
- Network utilization
- User adoption by role
```

### Tools Recommended
```
- Etherscan API for transaction verification
- Alchemy for monitoring and analytics
- The Graph for querying blockchain data
- Defenderwise for smart contract monitoring
```

---

## Summary

This integration enables:
✓ Decentralized, immutable order tracking
✓ Secure escrow-based payments
✓ Transparent transaction history
✓ Role-based transaction controls
✓ Automatic payment settlement
✓ Blockchain audit trail for compliance

Ready to implement when user provides go-ahead.
