# MetaMask Integration Workflow Documentation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│                                                                   │
│  ┌──────────────────┐          ┌──────────────────────┐         │
│  │  React Frontend  │◄────────►│  MetaMask Wallet     │         │
│  │  Components      │  Ethers  │  (Web3 Provider)     │         │
│  └────────┬─────────┘          └──────────────────────┘         │
│           │                                                       │
│           │ API Requests                                         │
│           ▼                                                       │
└─────────────────────────────────────────────────────────────────┘
           │
           │ HTTP/REST
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXPRESS BACKEND                                │
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐       │
│  │  /api/blockchain/* Routes                            │       │
│  │  - connect-wallet                                    │       │
│  │  - record-transaction                               │       │
│  │  - create-order                                      │       │
│  └──────────────────────────────────────────────────────┘       │
│                       ▲                                          │
│                       │                                          │
│  ┌────────────────────┴───────────────────────────────┐        │
│  │  Database (PostgreSQL)                             │        │
│  │  - userWallets                                     │        │
│  │  - blockchainTransactions                          │        │
│  │  - orderBlockchain                                 │        │
│  │  - orders, users, products                         │        │
│  └────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
           │
           │ JSON-RPC
           ▼
┌─────────────────────────────────────────────────────────────────┐
│              ETHEREUM BLOCKCHAIN (Sepolia Testnet)              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐       │
│  │  Smart Contracts (Deployed)                          │       │
│  │  - OrderManagement.sol                               │       │
│  │  - PaymentHandler.sol                                │       │
│  │  - ShipmentLedger.sol                                │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete User Journey Workflows

### 1. WALLET CONNECTION WORKFLOW

**Trigger:** User clicks "Connect Wallet" button in top navigation

**Flow:**

```
1. USER ACTION
   └─ Clicks "Connect Wallet" button in TopBar

2. FRONTEND (useWalletConnection Hook)
   ├─ Check: Is MetaMask installed?
   │  └─ No → Show error toast, stop
   │  └─ Yes → Continue
   │
   ├─ Call: window.ethereum.request()
   │  └─ Request wallet connection permission
   │
   ├─ User sees MetaMask popup
   │  └─ Selects account(s) to connect
   │  └─ Clicks "Connect"
   │
   ├─ Get connected account address
   │  └─ Fetch wallet balance using ethers.js
   │  └─ Get current network/chainId
   │
   └─ Update state:
      ├─ isConnected = true
      ├─ walletAddress = "0x..."
      ├─ balance = "1.234 ETH"
      ├─ chainId = 11155111 (Sepolia)
      └─ Show success toast

3. NETWORK CHECK
   ├─ If chainId ≠ 11155111 (not Sepolia)
   │  ├─ Show: "Switch to Sepolia Network" dialog
   │  └─ User clicks "Switch Network"
   │     ├─ Try: window.ethereum.request({ wallet_switchEthereumChain })
   │     ├─ If network not in wallet
   │     │  └─ Add network first (wallet_addEthereumChain)
   │     └─ Network switched
   │
   └─ If chainId = 11155111
      └─ Ready for transactions

4. WALLET BUTTON UI UPDATE
   ├─ Shows: Connected address (abbreviated)
   ├─ Shows: ETH balance
   ├─ Shows: Dropdown menu with "Disconnect" option
   └─ Listen for account/chain changes:
      ├─ User switches account in MetaMask
      │  └─ Auto-update wallet state
      ├─ User switches network in MetaMask
      │  └─ Prompt to switch back to Sepolia
      └─ User disconnects in MetaMask
         └─ Clear wallet state

5. BACKEND SYNC (Optional)
   ├─ POST /api/blockchain/connect-wallet
   │  ├─ Body: { walletAddress, chainId }
   │  ├─ Store in userWallets table
   │  └─ Return: wallet object with ID
   │
   └─ localStorage: Save wallet state for persistence
```

**Error Handling:**

| Error | Cause | Solution |
|-------|-------|----------|
| MetaMask not installed | User hasn't installed MetaMask | Show helpful message + download link |
| User rejected connection | User clicked "Cancel" | Allow retry, show helpful message |
| Wrong network | User on Ethereum Mainnet instead of Sepolia | Auto-prompt to switch networks |
| Network switch failed | Network not in wallet | Auto-add network, then switch |

---

### 2. MANUFACTURER CREATE ORDER WORKFLOW

**Role:** Manufacturer (user role = "manufacturer")
**Trigger:** Manufacturer creates new order

**Full Flow:**

```
STEP 1: ORDER CREATION (Frontend)
├─ Manufacturer navigates to "Create Order"
├─ Fills form:
│  ├─ Select supplier
│  ├─ Select product
│  ├─ Enter quantity
│  ├─ Enter price (amount to lock in escrow)
│  └─ Review total
│
└─ Clicks "Create Order & Lock Funds"

STEP 2: VALIDATION
├─ Frontend validates:
│  ├─ All fields filled
│  ├─ Wallet connected
│  ├─ Sufficient balance for escrow amount
│  ├─ Order amount > 0
│  └─ Supplier selected
│
└─ If valid → Continue
   If invalid → Show error toast, stop

STEP 3: DATABASE ORDER CREATION
├─ POST /api/orders (create DB record first)
│  ├─ Body: { customerId, productId, quantity, totalPrice, status: "placed" }
│  ├─ Database stores order record
│  ├─ Returns: orderId (database ID)
│  └─ Status = "placed" (not yet blockchain-backed)
│
└─ Get orderId from response

STEP 4: BLOCKCHAIN TRANSACTION PREPARATION
├─ Frontend prepares transaction:
│  ├─ Contract address: OrderManagement contract
│  ├─ Function: createOrder()
│  ├─ Parameters:
│  │  ├─ supplier address (from supplier wallet)
│  │  ├─ amount (in Wei: price * 10^18)
│  │  └─ productDetails (JSON string)
│  │
│  └─ Estimate gas:
│     ├─ Call: ethers.estimateGas()
│     └─ Display to user: ~0.05 ETH gas fee

STEP 5: USER APPROVAL
├─ Show transaction confirmation dialog:
│  ├─ Order details
│  ├─ Amount to lock: X ETH
│  ├─ Gas fee: ~0.05 ETH
│  ├─ Total cost: X.05 ETH
│  └─ Buttons: [Confirm] [Cancel]
│
├─ User clicks "Confirm"
│  └─ MetaMask popup appears (approval required)
│
├─ User reviews in MetaMask:
│  ├─ To: OrderManagement contract
│  ├─ Amount: 0 ETH (no direct payment, escrow handled by contract)
│  ├─ Gas: 200,000 gas × 1 Gwei = 0.0002 ETH
│  └─ User clicks "Confirm" in MetaMask
│
└─ Transaction submitted to Ethereum

STEP 6: TRANSACTION MINING
├─ Transaction hash received immediately
│  ├─ Show: Loading spinner with hash
│  ├─ Message: "Transaction submitted, waiting for confirmation..."
│  └─ Display: Etherscan link to watch progress
│
├─ Frontend polls transaction status:
│  ├─ Check every 2 seconds: ethers.getTransactionReceipt()
│  ├─ While pending:
│  │  └─ Show: "Pending (block X/Y)"
│  │
│  └─ When mined:
│     ├─ Gas used: 198,543 gas
│     ├─ Block number: 5,234,892
│     └─ Status: Success ✓

STEP 7: TRANSACTION RECORDING
├─ POST /api/blockchain/record-transaction
│  ├─ Body: {
│  │    orderId,
│  │    transactionHash,
│  │    functionName: "createOrder",
│  │    userId
│  │  }
│  ├─ Database stores transaction record
│  ├─ Status: "confirmed"
│  └─ Returns: transaction record

STEP 8: ORDER BLOCKCHAIN MAPPING
├─ POST /api/blockchain/create-order
│  ├─ Body: {
│  │    orderId,
│  │    contractAddress,
│  │    txHashCreated,
│  │    escrowAmount
│  │  }
│  ├─ Creates orderBlockchain record
│  ├─ Status: "locked" (funds in escrow)
│  └─ Links order to blockchain data

STEP 9: UPDATE ORDER STATUS
├─ PATCH /api/orders/:orderId
│  ├─ Update status: "confirmed" (blockchain-backed)
│  ├─ Add: blockchain transaction hash
│  └─ Send notification to manufacturer

STEP 10: NOTIFICATIONS
├─ Manufacturer receives:
│  ├─ Toast: "Order created successfully!"
│  ├─ Notification: Order ID, amount locked
│  └─ Dashboard update: Show new order
│
├─ Supplier receives:
│  ├─ Notification: "New order available from Manufacturer"
│  ├─ Order details visible in dashboard
│  └─ Can now accept order

STEP 11: USER FEEDBACK
├─ Frontend shows:
│  ├─ Success screen with order details
│  ├─ Blockchain confirmation details
│  ├─ Link to view on Etherscan
│  ├─ Button: "View Order" (redirects to order detail page)
│  └─ Button: "Create Another Order"

DATABASE STATE AFTER COMPLETION:
├─ orders table:
│  └─ orderId: ABC-123
│     ├─ customerId: mfg-001
│     ├─ status: "confirmed"
│     ├─ totalPrice: 1000 USD
│     └─ paymentStatus: "pending"
│
├─ orderBlockchain table:
│  └─ orderId: ABC-123
│     ├─ txHashCreated: 0x1234...
│     ├─ escrowAmount: 1.5 ETH
│     ├─ escrowStatus: "locked"
│     └─ contractAddress: 0x5678...
│
└─ blockchainTransactions table:
   └─ New record:
      ├─ txHash: 0x1234...
      ├─ userId: mfg-001
      ├─ functionName: "createOrder"
      ├─ status: "confirmed"
      └─ blockNumber: 5234892
```

---

### 3. SUPPLIER ACCEPT ORDER WORKFLOW

**Role:** Supplier (user role = "supplier")
**Trigger:** Supplier clicks "Accept Order" button

**Flow:**

```
STEP 1: SUPPLIER SEES AVAILABLE ORDERS
├─ GET /api/orders?status=placed&forSupplier=true
│  ├─ Fetches all unaccepted orders from their manufacturers
│  ├─ Displays in dashboard
│  └─ "Available Orders" card shows: Order ID, Amount, Manufacturer

STEP 2: SUPPLIER CLICKS "ACCEPT ORDER"
├─ Show order acceptance dialog:
│  ├─ Order details review
│  ├─ Amount to receive (after commission)
│  ├─ Supplier's wallet address shown
│  └─ Buttons: [Accept] [Cancel]

STEP 3: WALLET CHECK
├─ Verify supplier has connected wallet
│  ├─ If no wallet connected:
│  │  └─ Show: "Connect wallet first to accept orders"
│  │     └─ Link to wallet connection
│  │
│  └─ If wallet connected → Continue

STEP 4: BLOCKCHAIN ACCEPTANCE TRANSACTION
├─ Prepare transaction:
│  ├─ Contract: OrderManagement
│  ├─ Function: acceptOrder()
│  ├─ Parameters:
│  │  └─ orderId (blockchain order ID)
│  │
│  └─ Estimate gas: ~150,000 gas

STEP 5: USER CONFIRMATION
├─ Show confirmation dialog:
│  ├─ "Accept Order ABC-123?"
│  ├─ "Once accepted, only you can proceed with shipment"
│  ├─ Gas fee: ~0.03 ETH
│  └─ Buttons: [Confirm] [Cancel]
│
├─ User clicks "Confirm"
│  └─ MetaMask popup appears

STEP 6: TRANSACTION EXECUTION
├─ User approves in MetaMask
│  ├─ Transaction sent to blockchain
│  ├─ Show: Loading spinner
│  └─ Hash: 0x5678...

STEP 7: SMART CONTRACT LOGIC
├─ BlockChain executes acceptOrder():
│  ├─ Check: orderId exists
│  ├─ Check: No other supplier accepted yet (exclusivity)
│  ├─ Set: Order.acceptedBy = supplier address
│  ├─ Set: Order.status = "accepted"
│  ├─ Emit: OrderAccepted event
│  │  └─ { orderId, supplierId, timestamp }
│  │
│  └─ Lock: This supplier now has exclusive access

STEP 8: TRANSACTION CONFIRMATION
├─ Frontend polls status:
│  ├─ Wait for: 1 block confirmation
│  ├─ Show: "Confirming on blockchain..."
│  └─ Once confirmed:
│     ├─ Gas used: 148,234 gas
│     └─ Success: ✓

STEP 9: RECORD TRANSACTION
├─ POST /api/blockchain/record-transaction
│  ├─ Body: {
│  │    orderId,
│  │    transactionHash: 0x5678...,
│  │    functionName: "acceptOrder",
│  │    userId
│  │  }
│  └─ Creates blockchain transaction record

STEP 10: UPDATE ORDER STATUS
├─ PATCH /api/orders/:orderId
│  ├─ status: "confirmed" → "accepted"
│  ├─ supplier_id: ABC-123
│  ├─ tx_accepted: 0x5678...
│  └─ Send notifications

STEP 11: UPDATE BLOCKCHAIN ORDER MAPPING
├─ PATCH /api/blockchain/order/:orderId
│  ├─ txHashAccepted: 0x5678...
│  ├─ status: "accepted" (now exclusive to this supplier)
│  └─ Show supplier information

STEP 12: NOTIFICATIONS & FEEDBACK
├─ Supplier receives:
│  ├─ Toast: "Order accepted successfully!"
│  ├─ Order moves to "My Active Orders" section
│  └─ Can now proceed with shipment
│
├─ Manufacturer receives:
│  ├─ Notification: "Supplier accepted your order!"
│  ├─ Shows which supplier accepted
│  └─ Awaits shipment
│
├─ Other suppliers receive:
│  ├─ Notification: "Order no longer available"
│  └─ Can no longer accept this order

STEP 13: SUPPLIER DASHBOARD UPDATE
├─ Order moves from "Available" → "Active Orders"
├─ Shows action button: "Upload Shipment Details"
├─ Displays expected delivery date
└─ Tracks all blockchain transactions for this order

DATABASE STATE:
├─ orders table:
│  └─ ABC-123:
│     ├─ status: "accepted"
│     ├─ supplier_id: supp-001
│     └─ updated_at: NOW()
│
├─ orderBlockchain table:
│  └─ ABC-123:
│     ├─ txHashAccepted: 0x5678...
│     └─ escrowStatus: "locked" (still locked, released after delivery)
│
└─ blockchainTransactions table:
   └─ New record for acceptOrder transaction
```

---

### 4. SUPPLIER MARK SHIPPED WORKFLOW

**Role:** Supplier
**Trigger:** Supplier uploads shipment proof and marks as "shipped"

**Flow:**

```
STEP 1: SUPPLIER INITIATES SHIPMENT
├─ Clicks "Mark as Shipped" on order
├─ Form appears:
│  ├─ Tracking number (from shipping carrier)
│  ├─ Carrier (FedEx, UPS, DHL, etc.)
│  ├─ Upload shipment image/proof
│  ├─ Estimated delivery date
│  └─ Buttons: [Submit] [Cancel]

STEP 2: DATA VALIDATION
├─ Validate:
│  ├─ Tracking number format
│  ├─ Carrier selected
│  ├─ Proof image uploaded (optional but recommended)
│  └─ All required fields

STEP 3: IPFS UPLOAD (Optional)
├─ If image provided:
│  ├─ Upload to IPFS or centralized storage
│  ├─ Get: IPFS hash or URL
│  └─ Will be recorded in blockchain

STEP 4: DATABASE SHIPMENT RECORD
├─ POST /api/shipments
│  ├─ Body: {
│  │    orderId,
│  │    tracking_number,
│  │    carrier,
│  │    proof_url,
│  │    estimated_delivery,
│  │    status: "in-transit"
│  │  }
│  ├─ Creates shipment record
│  └─ Returns: shipmentId

STEP 5: BLOCKCHAIN SHIPMENT RECORDING
├─ Prepare transaction:
│  ├─ Contract: ShipmentLedger or OrderManagement
│  ├─ Function: shipOrder() or recordShipment()
│  ├─ Parameters:
│  │  ├─ orderId
│  │  ├─ trackingInfo (JSON):
│  │  │  ├─ trackingNumber
│  │  │  ├─ carrier
│  │  │  ├─ proofHash (IPFS hash if applicable)
│  │  │  └─ timestamp
│  │  │
│  │  └─ metadata
│
STEP 6: USER APPROVES TRANSACTION
├─ Show confirmation:
│  ├─ "Record shipment on blockchain?"
│  ├─ Gas fee estimate: ~0.04 ETH
│  └─ Buttons: [Confirm] [Cancel]
│
├─ Click "Confirm"
│  └─ MetaMask approval popup

STEP 7: BLOCKCHAIN EXECUTION
├─ Smart contract shipOrder() executes:
│  ├─ Check: Order was accepted by this supplier
│  ├─ Check: Not already shipped
│  ├─ Set: Order.status = "shipped"
│  ├─ Record: {
│  │    shipmentDetails,
│  │    timestamp,
│  │    supplier_address,
│  │    current_location
│  │  }
│  ├─ Emit: OrderShipped event
│  │  └─ { orderId, shipmentId, carrier, timestamp }
│  │
│  └─ Escrow status remains: "locked" (released on delivery only)

STEP 8: TRANSACTION CONFIRMATION
├─ Frontend polls for confirmation
├─ Show: "Recording shipment on blockchain..."
└─ Once confirmed:
   ├─ Transaction hash: 0x9ABC...
   ├─ Block: 5234950
   └─ Status: ✓ Success

STEP 9: RECORD BLOCKCHAIN TRANSACTION
├─ POST /api/blockchain/record-transaction
│  ├─ functionName: "shipOrder"
│  ├─ txHash: 0x9ABC...
│  └─ Store in database

STEP 10: UPDATE BLOCKCHAIN ORDER MAPPING
├─ PATCH /api/blockchain/order/:orderId
│  ├─ txHashShipped: 0x9ABC...
│  └─ Update escrow status tracking

STEP 11: UPDATE ORDER STATUS
├─ PATCH /api/orders/:orderId
│  ├─ status: "accepted" → "shipped"
│  ├─ tx_shipped: 0x9ABC...
│  ├─ Add tracking info
│  └─ Send notifications

STEP 12: NOTIFICATIONS
├─ Supplier:
│  ├─ Toast: "Order marked as shipped!"
│  ├─ View blockchain: Link to Etherscan
│  └─ Dashboard: Show tracking info
│
├─ Manufacturer:
│  ├─ Notification: "Order shipped by supplier"
│  ├─ Tracking details provided
│  └─ Awaits customer confirmation
│
└─ Customer:
   ├─ Notification: "Your order is on the way!"
   ├─ Tracking: Available in app
   └─ Can now "Confirm Delivery"

STEP 13: SHIPMENT TRACKING UPDATES
├─ Optional: API polls carrier API (Ship24, EasyPost, etc.)
│  ├─ Fetches live tracking status
│  ├─ Updates current location
│  └─ Shows estimated arrival
│
└─ Real-time updates to customer dashboard

DATABASE STATE:
├─ shipments table:
│  └─ New record:
│     ├─ shipmentId: SHIP-001
│     ├─ orderId: ABC-123
│     ├─ carrier: "FedEx"
│     ├─ trackingNumber: "794629384750"
│     ├─ status: "in-transit"
│     └─ estimatedDelivery: 2024-12-20
│
├─ orderBlockchain table:
│  └─ ABC-123:
│     ├─ txHashShipped: 0x9ABC...
│     └─ escrowStatus: "locked" (still locked)
│
└─ blockchainTransactions table:
   └─ New shipOrder transaction
```

---

### 5. CUSTOMER CONFIRM DELIVERY WORKFLOW

**Role:** Customer (recipient)
**Trigger:** Customer receives package and confirms delivery

**Flow:**

```
STEP 1: CUSTOMER RECEIVES PACKAGE
├─ Notification: "Your package has arrived"
├─ Dashboard shows: Order ready to confirm
├─ Shows button: "Confirm Delivery"

STEP 2: CUSTOMER REVIEWS ORDER
├─ Clicks order details
├─ Verifies:
│  ├─ Items received
│  ├─ Correct quantity
│  ├─ No damage
│  └─ All good → Clicks "Confirm Delivery"

STEP 3: CONFIRMATION DIALOG
├─ Show dialog:
│  ├─ "Confirm you received the order?"
│  ├─ Shipment details displayed
│  ├─ Last tracking update shown
│  └─ Buttons: [Confirm] [Report Issue]

STEP 4: WALLET CHECK
├─ Verify customer has connected wallet
│  ├─ If no wallet:
│  │  └─ Prompt to connect wallet first
│  │
│  └─ If wallet exists → Continue

STEP 5: DATABASE CONFIRMATION
├─ PUT /api/orders/:orderId
│  ├─ status: "shipped" → "delivered"
│  ├─ delivery_confirmation_date: NOW()
│  ├─ delivery_confirmed_by: customer_address
│  └─ Returns: updated order

STEP 6: BLOCKCHAIN DELIVERY CONFIRMATION
├─ Prepare transaction:
│  ├─ Contract: OrderManagement
│  ├─ Function: deliverOrder()
│  ├─ Parameters:
│  │  ├─ orderId
│  │  ├─ customerSignature (signed by customer wallet)
│  │  └─ timestamp
│
│  └─ Estimate gas: ~0.03 ETH

STEP 7: USER APPROVAL
├─ Show confirmation:
│  ├─ "Confirm delivery on blockchain?"
│  ├─ This triggers payment release
│  ├─ Gas fee: ~0.03 ETH
│  └─ Buttons: [Confirm] [Cancel]
│
├─ Click "Confirm"
│  └─ MetaMask popup appears

STEP 8: BLOCKCHAIN EXECUTION
├─ Smart contract deliverOrder() executes:
│  ├─ Check: Order is in "shipped" state
│  ├─ Check: Signature is from customer
│  ├─ Verify: 30+ days NOT passed (prevent claims after 30 days)
│  ├─ Set: Order.status = "delivered"
│  ├─ Set: Order.deliveredAt = NOW()
│  │
│  ├─ CRITICAL: RELEASE ESCROW
│  │  ├─ Get: escrow amount
│  │  ├─ Call: PaymentHandler.releasePayment()
│  │  ├─ Transfer: Funds to supplier wallet
│  │  └─ Emit: PaymentReleased event
│  │
│  ├─ Update: escrowStatus = "released"
│  ├─ Emit: OrderDelivered event
│  │  └─ { orderId, customerId, supplierId, amount, timestamp }
│  │
│  └─ Emit: PaymentReleased event
│     └─ { orderId, supplierId, amount, timestamp }

STEP 9: TRANSACTION CONFIRMATION
├─ Frontend monitors transaction
├─ Show: "Confirming delivery on blockchain..."
└─ Once confirmed:
   ├─ Show: ✓ Delivery confirmed
   ├─ Transaction hash: 0xDEF0...
   └─ Gas used: 125,432 gas

STEP 10: RECORD BLOCKCHAIN TRANSACTIONS
├─ POST /api/blockchain/record-transaction (deliverOrder)
│  ├─ functionName: "deliverOrder"
│  ├─ txHash: 0xDEF0...
│  └─ Status: "confirmed"
│
└─ POST /api/blockchain/record-transaction (releasePayment)
   ├─ functionName: "releasePayment"
   ├─ txHash: 0xABC1... (from PaymentHandler)
   └─ Status: "confirmed"

STEP 11: UPDATE BLOCKCHAIN MAPPINGS
├─ PATCH /api/blockchain/order/:orderId
│  ├─ txHashDelivered: 0xDEF0...
│  ├─ txHashPaymentReleased: 0xABC1...
│  └─ escrowStatus: "released" (funds transferred)

STEP 12: UPDATE ORDER STATUS
├─ PATCH /api/orders/:orderId
│  ├─ status: "delivered"
│  ├─ paymentStatus: "completed"
│  ├─ delivery_confirmed_at: NOW()
│  ├─ payment_released_at: NOW()
│  └─ blockchain_payment_tx: 0xABC1...

STEP 13: NOTIFICATIONS
├─ Customer receives:
│  ├─ Toast: "Delivery confirmed! Thank you!"
│  ├─ Order moves to "Completed Orders"
│  ├─ Prompt: "Rate this order" (optional)
│  └─ View blockchain confirmation
│
├─ Supplier receives:
│  ├─ Notification: "Order delivered! Payment released!"
│  ├─ Amount received: X.XX ETH
│  ├─ Wallet should show new balance (after gas fees)
│  └─ View payment transaction on Etherscan
│
├─ Manufacturer receives:
│  ├─ Notification: "Order completed successfully!"
│  ├─ Delivery confirmation details
│  └─ Can now see full order lifecycle

STEP 14: CUSTOMER CAN LEAVE REVIEW (Optional)
├─ Dialog: "How was your experience?"
├─ Options:
│  ├─ Star rating (1-5)
│  ├─ Written review
│  └─ Buttons: [Submit] [Skip]
│
└─ Rating stored in ratings table

DATABASE FINAL STATE:
├─ orders table:
│  └─ ABC-123:
│     ├─ status: "delivered"
│     ├─ paymentStatus: "completed"
│     ├─ delivery_confirmed_at: 2024-12-20 14:30:00
│     └─ completed_at: 2024-12-20 14:30:00
│
├─ orderBlockchain table:
│  └─ ABC-123:
│     ├─ txHashDelivered: 0xDEF0...
│     ├─ txHashPaymentReleased: 0xABC1...
│     ├─ escrowStatus: "released"
│     └─ payment_released_amount: 1.5 ETH
│
├─ blockchainTransactions table:
│  ├─ deliverOrder tx
│  └─ releasePayment tx
│
└─ ratings table (if submitted):
   └─ New review record

WALLET STATE:
├─ Customer wallet:
│  ├─ ETH balance: unchanged (already paid via escrow)
│  └─ Gas fees: -0.03 ETH (confirmation tx cost)
│
└─ Supplier wallet:
   ├─ ETH balance: +1.5 ETH (payment released from escrow)
   └─ Minus gas fees from earlier acceptOrder tx
```

---

## Key Blockchain Events Flow

```
Timeline of Blockchain Events:

TIME    EVENT                   EMITTER                STATUS              WALLET
────────────────────────────────────────────────────────────────────────────────
T0      Order Created           OrderManagement        Escrow: LOCKED      -1.5 ETH (Mfg)
        (Funds in Escrow)       Contract               Order: PLACED

T1      Order Accepted          OrderManagement        Order: ACCEPTED     -0.03 ETH (Supp)
        (Exclusive to Supplier) Contract               Escrow: LOCKED

T2      Order Shipped           ShipmentLedger         Order: SHIPPED      -0.04 ETH (Supp)
        (Proof Recorded)        Contract               Escrow: LOCKED

T3      Delivery Confirmed      OrderManagement        Order: DELIVERED    -0.03 ETH (Cust)
        Payment Released        PaymentHandler         Escrow: RELEASED
                                Contract               Payment: COMPLETED

        Final Wallet State:
        ├─ Manufacturer: -1.5 ETH (order + gas fees)
        ├─ Supplier: +1.5 ETH - 0.10 ETH (gas fees) = +1.4 ETH net
        └─ Customer: -0.03 ETH (confirmation gas fee)
```

---

## Error Recovery Workflows

### Transaction Rejected
```
User clicks "Confirm" in MetaMask but then cancels

Flow:
├─ Frontend catches: "ACTION_REJECTED"
├─ Show: "Transaction cancelled by user"
├─ Options:
│  ├─ [Retry] - Try again
│  └─ [Go Back] - Return to dashboard
│
└─ No blockchain state changes (safe)
```

### Transaction Fails After Submission
```
Transaction submitted but reverts on blockchain

Flow:
├─ Frontend detects: tx.status = 0 (failed)
├─ Fetch: tx receipt + error reason
├─ Show: User-friendly error message
├─ Log: Error details for debugging
├─ Options:
│  ├─ [Retry with Higher Gas] - Increase gas price
│  └─ [Go Back] - Return to dashboard
│
└─ No wallet state affected (funds safe)
```

### Network Switch Required
```
User is on wrong network

Flow:
├─ Detect: chainId ≠ 11155111
├─ Show: "Please switch to Sepolia network"
├─ Options:
│  ├─ [Switch Network] - Auto-switch if installed
│  └─ [Continue Anyway] - Try on current network (may fail)
│
└─ If user doesn't switch:
   ├─ Transaction fails at MetaMask popup
   └─ Show: "This transaction requires Sepolia network"
```

---

## Real-Time Polling & Synchronization

**Frontend Polling (Browser):**
```
Every 2 seconds when order is pending:
├─ Check transaction status
│  └─ ethers.getTransactionReceipt(txHash)
│
└─ If 1+ block confirmation:
   ├─ Mark as confirmed
   ├─ Fetch final details
   └─ Update UI

Every 5 seconds for shipment tracking:
├─ If order is "shipped":
│  ├─ Call: /api/shipments/:shipmentId/tracking
│  ├─ Fetch live tracking data
│  └─ Update current location on map
│
└─ If delivery confirmed:
   └─ Stop polling
```

**Backend Event Listeners (Server):**
```
Listens for smart contract events:

OrderCreated event:
├─ Extract: orderId, manufacturerId, amount
├─ Database: Create orderBlockchain record
└─ Notify: Eligible suppliers

OrderAccepted event:
├─ Update: Database order status
├─ Notify: Manufacturer + other suppliers
└─ Lock: Order exclusive to supplier

OrderShipped event:
├─ Update: Shipment status in DB
├─ Notify: Customer with tracking
└─ Enable: Delivery confirmation

PaymentReleased event:
├─ Update: Payment status to "completed"
├─ Notify: Supplier with payment details
└─ Mark: Order as "final"
```

---

## Summary: Complete Transaction Lifecycle

```
MANUFACTURER → SUPPLIER → CUSTOMER → BLOCKCHAIN SETTLEMENT

Phase 1: ORDER CREATION (Manufacturer)
├─ Create order (DB)
├─ Lock funds in blockchain escrow
├─ Set exclusivity: waiting for supplier
└─ Status: "placed" → "confirmed"

Phase 2: ORDER ACCEPTANCE (Supplier)
├─ Review available order
├─ Accept order (exclusive claim)
├─ Status: "confirmed" → "accepted"
└─ Awaiting: Shipment preparation

Phase 3: SHIPMENT (Supplier)
├─ Mark as shipped
├─ Record tracking on blockchain
├─ Status: "accepted" → "shipped"
└─ Awaiting: Delivery confirmation

Phase 4: DELIVERY & PAYMENT (Customer)
├─ Confirm receipt
├─ Trigger blockchain payment release
├─ Status: "shipped" → "delivered"
└─ Escrow: "locked" → "released" → Supplier wallet

Phase 5: COMPLETION
├─ Order archived in "Completed Orders"
├─ Blockchain has immutable record
├─ All parties satisfied
└─ Supplier has received payment (net of gas fees)
```

This workflow ensures:
✓ Transparency: All transactions on blockchain
✓ Security: Escrow prevents fraud
✓ Efficiency: Automated payment release
✓ Accountability: Immutable record for all actions
✓ Dispute Resolution: Clear blockchain evidence

