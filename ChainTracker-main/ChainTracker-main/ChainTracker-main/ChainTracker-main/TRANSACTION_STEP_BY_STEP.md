# Complete Transaction Workflow - Step by Step Guide

## 🚀 Quick Start: What You Need First

Before starting ANY transaction, complete these prerequisites:

### ✅ Step 0: Install MetaMask (One-Time Setup)
1. Go to: https://metamask.io
2. Click "Download Now"
3. Choose your browser (Chrome, Firefox, etc.)
4. Install the extension
5. Create a new wallet and write down your recovery phrase (save it!)
6. You now have a MetaMask wallet with Sepolia testnet

### ✅ Step 1: Get Testnet ETH (One-Time Setup)
To do transactions, you need test ETH (free fake money for testing):

**For Sepolia Testnet:**
1. Visit: https://sepoliafaucet.com
2. Enter your wallet address (from MetaMask)
3. Click "Send Sepolia ETH"
4. Wait 1-2 minutes
5. You should see ~0.5 ETH in your wallet
6. Done! You're ready for transactions

### ✅ Step 2: Connect Your Wallet to Supply Chain Tracker
1. Open the Supply Chain Tracker app (http://localhost:5000)
2. Look at the **TOP RIGHT** corner of the screen
3. You'll see a **"Connect Wallet"** button (looks like a wallet icon)
4. Click it
5. MetaMask popup appears
6. Select your account
7. Click "Connect"
8. You should see your wallet address and ETH balance at the top
9. Great! Wallet is connected ✅

---

## 📋 TRANSACTION FLOW 1: MANUFACTURER - Create an Order

### Overview
You (Manufacturer) place an order and lock funds in escrow. Money is safe until customer receives the order.

### What You Need
- ✅ Connected wallet with ~0.1+ ETH (for gas fees)
- ✅ Logged in as a Manufacturer role
- ✅ A supplier to send the order to
- ✅ A product available in the system

### Detailed Steps:

```
PART 1: NAVIGATE TO CREATE ORDER
═══════════════════════════════════

Step 1: Go to Orders Page
  └─ Click "Orders" in left sidebar
  └─ You see list of all orders
  └─ Look for "+ Create Order" button at top right
  └─ Click it

Step 2: Order Form Appears
  └─ You see a form with fields to fill
  └─ Fields are:
     ├─ Select Supplier (dropdown)
     ├─ Select Product (dropdown)
     ├─ Quantity (number)
     ├─ Price Per Unit (number)
     └─ (Total price calculates automatically)

PART 2: FILL OUT THE FORM
═══════════════════════════════════

Step 3: Select a Supplier
  └─ Click "Select Supplier" dropdown
  └─ You see list of available suppliers
  └─ Example: "John's Supply Co", "Premium Imports", etc.
  └─ Click one to select it

Step 4: Select a Product
  └─ Click "Select Product" dropdown
  └─ You see list of available products
  └─ Example: "Widget A", "Gadget Pro", "Component X"
  └─ Click one to select it

Step 5: Enter Quantity
  └─ Click in "Quantity" field
  └─ Enter a number (e.g., 100)
  └─ Example: 100 units

Step 6: Enter Price Per Unit
  └─ Click in "Price Per Unit" field
  └─ Enter amount in ETH (e.g., 0.01)
  └─ Example: 0.01 ETH per unit
  └─ Total = 100 units × 0.01 = 1.0 ETH locked

Step 7: Review the Summary
  └─ You should see:
     ├─ Supplier: [name you selected]
     ├─ Product: [name you selected]
     ├─ Quantity: [number you entered]
     ├─ Unit Price: [amount you entered]
     ├─ Total: [calculated amount]
     ├─ Gas Fee: ~0.05 ETH (estimated)
     └─ Total Cost: [total + gas]

PART 3: SUBMIT TO BLOCKCHAIN
═══════════════════════════════════

Step 8: Click "Create Order & Lock Funds"
  └─ Red/Purple button at bottom of form
  └─ Click it
  └─ You see: "Please confirm this action"

Step 9: Confirmation Dialog Appears
  └─ Shows all details you entered
  └─ Shows: "Amount to lock: 1.0 ETH"
  └─ Shows: "Gas fee: ~0.05 ETH"
  └─ Shows: "Total cost: ~1.05 ETH"
  └─ Two buttons:
     ├─ [Confirm] - Green button (DO THIS)
     └─ [Cancel] - Gray button

Step 10: Click "Confirm"
  └─ Click the green "Confirm" button
  └─ MetaMask popup appears immediately
  └─ You see transaction details:
     ├─ To: Contract Address
     ├─ Amount: 0 ETH (funds locked by contract)
     ├─ Gas: 200,000 gas
     ├─ Gas price: 1 Gwei
     ├─ Estimated total: ~0.2 ETH
  └─ Two buttons in MetaMask:
     ├─ [Reject] - Cancel (DON'T DO THIS unless you want to cancel)
     └─ [Confirm] - Approve (CLICK THIS)

Step 11: Click "Confirm" in MetaMask
  └─ This actually sends the transaction
  └─ MetaMask popup closes
  └─ You're back at the app
  └─ You see: "Transaction submitted, please wait..."

PART 4: WAIT FOR CONFIRMATION
═══════════════════════════════════

Step 12: Loading Screen
  └─ App shows: "Processing your order..."
  └─ A spinner/loading animation plays
  └─ Shows transaction hash (for reference)
  └─ Link to view on Etherscan (block explorer)
  └─ WAIT - Do NOT close the page!

Step 13: Transaction Mines
  └─ Can take 10-60 seconds
  └─ Blockchain validates your transaction
  └─ Your funds get locked in escrow

Step 14: Success Message
  └─ You see: "✅ Order Created Successfully!"
  └─ Shows:
     ├─ Order ID: SCT-12345-ABCDE
     ├─ Status: Confirmed
     ├─ Amount Locked: 1.0 ETH
     ├─ Supplier: [name]
     ├─ Blockchain Transaction: 0x1234...
  └─ Buttons:
     ├─ [View Order] - Go to order details
     └─ [Create Another Order]

PART 5: AFTER ORDER IS CREATED
═══════════════════════════════════

Step 15: What Happens Next
  ├─ Order appears in your Dashboard
  ├─ Status shows: "Waiting for Supplier"
  ├─ Supplier gets notification
  ├─ Supplier can now "Accept Order"
  ├─ Your funds stay locked (safe in escrow)
  └─ Funds released only when customer confirms delivery

IMPORTANT NOTES:
════════════════
❌ DO NOT: Close the page during "Processing"
❌ DO NOT: Click "Create Order" twice
❌ DO NOT: Switch networks while processing
✅ DO: Keep page open until you see success message
✅ DO: Screenshot the order ID for records
✅ DO: Check your wallet - balance reduced by ~1.05 ETH
```

---

## 📋 TRANSACTION FLOW 2: SUPPLIER - Accept an Order

### Overview
You (Supplier) accept an order. Once accepted, ONLY you can fulfill this order (first-come, first-served).

### What You Need
- ✅ Connected wallet with ~0.05+ ETH (for gas)
- ✅ Logged in as a Supplier role
- ✅ Available orders to accept
- ✅ Same suppliers, different manufacturers

### Detailed Steps:

```
PART 1: FIND AVAILABLE ORDERS
═══════════════════════════════════

Step 1: Go to Supplier Dashboard
  └─ Click "Dashboard" in left sidebar
  └─ You see your supplier metrics
  └─ You see sections:
     ├─ Available Orders (unaccepted)
     ├─ My Active Orders (accepted by you)
     └─ Pending Orders

Step 2: Look for "Available Orders" Section
  └─ You should see cards/list of orders
  └─ Each card shows:
     ├─ Order ID
     ├─ Manufacturer name
     ├─ Product details
     ├─ Quantity
     ├─ Amount offered
     └─ [Accept Order] button

Step 3: Find an Order You Want to Accept
  └─ Read the order details
  └─ Check if you can fulfill it
  └─ Look at the amount (you'll earn this - minus gas fees)

PART 2: ACCEPT THE ORDER
═══════════════════════════════════

Step 4: Click "Accept Order" Button
  └─ On the order card you want
  └─ Click the blue "Accept Order" button
  └─ A confirmation dialog appears

Step 5: Confirmation Dialog
  └─ You see:
     ├─ Order details summary
     ├─ Amount you'll earn: 1.0 ETH
     ├─ Gas fee: ~0.03 ETH
     ├─ Your wallet: [your address]
     └─ Warning: "Once accepted, only you can ship this"
  └─ Two buttons:
     ├─ [Cancel] - Don't accept
     └─ [Confirm] - Accept it (CLICK THIS)

Step 6: Click "Confirm"
  └─ MetaMask popup appears
  └─ Shows transaction:
     ├─ Function: acceptOrder()
     ├─ Amount: 0 ETH (no direct payment)
     ├─ Gas: 150,000 gas
     └─ Estimated: ~0.03 ETH
  └─ Two buttons:
     ├─ [Reject] - Cancel
     └─ [Confirm] - Approve (CLICK THIS)

Step 7: Click "Confirm" in MetaMask
  └─ Transaction sent to blockchain
  └─ MetaMask closes
  └─ You see: "Processing acceptance..."
  └─ WAIT for confirmation

PART 3: ORDER IS NOW YOURS
═══════════════════════════════════

Step 8: Success Message
  └─ You see: "✅ Order Accepted!"
  └─ Order moves to "My Active Orders"
  └─ Buttons appear:
     ├─ [Upload Shipment] - Mark as shipped
     ├─ [View Details]
     └─ [Print Label]

Step 9: Other Suppliers See This
  └─ Other suppliers get notified
  └─ Order disappears from their "Available"
  └─ Only shows: "Order taken by another supplier"

NEXT STEPS:
════════════════
→ Prepare the order
→ Get tracking number from carrier
→ Go to next step: "Mark as Shipped"
```

---

## 📋 TRANSACTION FLOW 3: SUPPLIER - Mark as Shipped

### Overview
You (Supplier) upload shipment tracking details to blockchain.

### Detailed Steps:

```
PART 1: FIND THE ORDER
═══════════════════════════════════

Step 1: Go to Dashboard
  └─ Click "Dashboard"
  └─ Go to "My Active Orders" section
  └─ Find the order you just accepted

Step 2: Click Order
  └─ Click on the order card/row
  └─ Order details page opens

PART 2: UPLOAD SHIPMENT DETAILS
═══════════════════════════════════

Step 3: Find "Mark as Shipped" Section
  └─ Scroll down on order details
  └─ You see form:
     ├─ Tracking Number field
     ├─ Carrier dropdown (FedEx, UPS, DHL, etc.)
     ├─ File upload for proof
     ├─ Estimated Delivery date
     └─ [Submit Shipment] button

Step 4: Enter Tracking Number
  └─ Click "Tracking Number" field
  └─ Example: "794629384750" (from your shipping label)
  └─ Enter the number

Step 5: Select Carrier
  └─ Click "Carrier" dropdown
  └─ Choose: FedEx, UPS, DHL, India Post, etc.
  └─ Click to select

Step 6: (Optional) Upload Proof
  └─ Click "Upload Image"
  └─ Select a photo of the shipment/label
  └─ Or leave blank if not needed

Step 7: Set Delivery Date
  └─ Click "Estimated Delivery" field
  └─ Calendar appears
  └─ Select the date when it should arrive
  └─ Example: 3 days from now

PART 3: SUBMIT TO BLOCKCHAIN
═══════════════════════════════════

Step 8: Click "Submit Shipment"
  └─ Click green button at bottom
  └─ Confirmation dialog:
     ├─ Tracking: 794629384750
     ├─ Carrier: FedEx
     ├─ Delivery: [date]
     ├─ Gas fee: ~0.04 ETH
  └─ Two buttons:
     ├─ [Cancel]
     └─ [Confirm] (CLICK THIS)

Step 9: MetaMask Appears
  └─ Transaction details shown
  └─ Gas: 180,000 gas
  └─ Total: ~0.04 ETH
  └─ Click [Confirm] in MetaMask

Step 10: Processing
  └─ See: "Uploading shipment to blockchain..."
  └─ Loading animation
  └─ WAIT for confirmation

Step 11: Success
  └─ You see: "✅ Shipment Uploaded!"
  └─ Order status: "In Transit"
  └─ Tracking info is now visible to customer
  └─ Customer gets notification

NEXT STEPS:
════════════════
→ Customer receives package
→ Customer clicks "Confirm Delivery"
→ Your funds are released!
```

---

## 📋 TRANSACTION FLOW 4: CUSTOMER - Confirm Delivery

### Overview
You (Customer) confirm you received the order. This RELEASES payment to the supplier.

### Detailed Steps:

```
PART 1: RECEIVE THE ORDER
═══════════════════════════════════

Step 1: Package Arrives
  └─ You receive the physical package
  └─ Check contents
  └─ Verify quality and quantity

Step 2: Verify Order Details
  └─ Make sure:
     ├─ Correct items received
     ├─ Correct quantity
     ├─ No damage
     └─ All good? Continue to next step

PART 2: FIND THE ORDER IN APP
═══════════════════════════════════

Step 3: Go to Orders Page
  └─ Click "Orders" in sidebar
  └─ Look for the order with status "Shipped"
  └─ Click on it

Step 4: Order Details Page
  └─ You see:
     ├─ Order ID
     ├─ Status: "Shipped"
     ├─ Tracking info
     ├─ Supplier info
     ├─ Product details
     └─ "Confirm Delivery" button (red/purple)

PART 3: CONFIRM DELIVERY
═══════════════════════════════════

Step 5: Click "Confirm Delivery"
  └─ Click the button on the order
  └─ Confirmation dialog:
     ├─ "Confirm you received this order?"
     ├─ Shows all order details
     ├─ Shows: "This will release payment to supplier"
     ├─ Gas fee: ~0.03 ETH
  └─ Two buttons:
     ├─ [No, Cancel]
     └─ [Yes, Confirm] (CLICK THIS)

Step 6: Click "Yes, Confirm"
  └─ MetaMask popup appears
  └─ Shows:
     ├─ Function: deliverOrder()
     ├─ Gas: 160,000 gas
     ├─ Total: ~0.03 ETH
  └─ Two buttons:
     ├─ [Reject] - Don't confirm
     └─ [Confirm] - Release payment (CLICK THIS)

Step 7: Click "Confirm" in MetaMask
  └─ Transaction sent
  └─ You see: "Confirming delivery on blockchain..."
  └─ WAIT for blockchain to process

PART 4: PAYMENT IS RELEASED!
═══════════════════════════════════

Step 8: Success Message
  └─ You see: "✅ Delivery Confirmed!"
  └─ Order status changes to: "Delivered"
  └─ Shows:
     ├─ Delivery confirmed on blockchain
     ├─ Transaction hash
     ├─ Timestamp

Step 9: What Happens Next
  ├─ Supplier receives payment (1.0 ETH)
  ├─ Minus their gas fees (~0.1 ETH) = ~0.9 ETH net
  ├─ You see in your history: Order completed
  ├─ Supplier gets notification: "Payment received!"
  ├─ Optional: Leave a review/rating
  └─ Everyone is happy! ✅

TIMELINE SUMMARY:
════════════════
Manufacturer: -1.05 ETH (order + gas)
Supplier:     +0.9 ETH (after gas fees)
Customer:     -0.03 ETH (confirmation gas fee only)
```

---

## ❌ TROUBLESHOOTING - If Something Goes Wrong

### Problem 1: "Connect Wallet" button does nothing
**Solution:**
- Make sure MetaMask is installed (check browser extensions)
- Check if you're on correct network (should be Sepolia)
- Try refreshing the page: Ctrl+R
- Try clicking the button again

### Problem 2: MetaMask popup doesn't appear
**Solution:**
- MetaMask might be hidden behind the app window
- Look at your browser toolbar
- Click the MetaMask extension icon
- Approve from there
- Or check if there's a pop-up blocker blocking it

### Problem 3: "Insufficient funds" error
**Solution:**
- You don't have enough ETH for gas
- Go to: https://sepoliafaucet.com
- Enter your wallet address
- Request more test ETH
- Wait 1-2 minutes
- Refresh and try again

### Problem 4: Transaction shows "Pending" for too long (>5 min)
**Solution:**
- Network might be congested
- Wait a few more minutes
- If still pending after 10 min:
  - Open MetaMask
  - Look for the transaction
  - You can "Speed Up" by paying higher gas
  - Or "Cancel" and try again

### Problem 5: "MetaMask not installed" error
**Solution:**
- Install MetaMask: https://metamask.io
- Create a wallet
- Add Sepolia testnet
- Get test ETH from faucet
- Connect to app again

### Problem 6: Wrong Network Error
**Solution:**
- You're on Ethereum Mainnet instead of Sepolia
- Open MetaMask
- Click network dropdown (top of MetaMask)
- Select "Sepolia" testnet
- Refresh app
- Try transaction again

### Problem 7: "Transaction rejected" message
**Solution:**
- You clicked [Reject] in MetaMask (or timed out)
- This is normal - transaction didn't go through
- Try again:
  - Click [Confirm Order] again
  - MetaMask popup appears
  - This time, click [Confirm]
- No funds lost - cancellations are free!

---

## 📊 Expected Costs (Gas Fees)

| Action | Gas Used | Cost (Sepolia) |
|--------|----------|----------------|
| Create Order | 200,000 | ~0.05 ETH |
| Accept Order | 150,000 | ~0.03 ETH |
| Mark Shipped | 180,000 | ~0.04 ETH |
| Confirm Delivery | 160,000 | ~0.03 ETH |
| **Total Per Order** | **690,000** | **~0.15 ETH** |

---

## ✅ Checklist Before Starting

- [ ] MetaMask installed
- [ ] Sepolia testnet selected
- [ ] ~0.5 test ETH in wallet (from faucet)
- [ ] Connected wallet to app (see address in top-right)
- [ ] Logged in as correct role (Manufacturer/Supplier/Customer)
- [ ] Understand the 4-step process (Create → Accept → Ship → Deliver)
- [ ] Ready to go!

---

## 🎯 Summary: Transaction Flow

```
MANUFACTURER WORKFLOW:
  1. Create Order (lock 1.0 ETH) → Success
  2. Supplier accepts
  3. Supplier ships
  4. Customer confirms delivery
  5. ✅ You paid 1.0 ETH + ~0.05 gas

SUPPLIER WORKFLOW:
  1. Accept available order → Success
  2. Prepare shipment
  3. Mark as shipped (upload tracking) → Success
  4. Customer confirms delivery
  5. ✅ You earned 1.0 ETH - ~0.1 gas = 0.9 ETH net

CUSTOMER WORKFLOW:
  1. Receive package from supplier
  2. Verify contents
  3. Confirm delivery (release payment) → Success
  4. ✅ You paid ~0.03 ETH gas only (product was paid earlier)
  
ALL USERS:
  ✅ See immutable blockchain record
  ✅ Get notifications at each step
  ✅ Can view all transactions on Etherscan
  ✅ All funds secured until final confirmation
```

---

## 🆘 Still Having Issues?

If you encounter errors not listed here:

1. **Check browser console** (F12 → Console tab)
   - Look for red error messages
   - Take screenshot
   
2. **Check MetaMask**
   - Make sure network is Sepolia
   - Make sure balance is > 0 ETH
   
3. **Try this debug process:**
   - Refresh page (Ctrl+R)
   - Reconnect wallet
   - Try transaction again

4. **If still stuck:**
   - Check app backend logs
   - Try from incognito window
   - Clear browser cache

---

## 📚 Key Concepts to Remember

**Escrow:** Money locked by smart contract, released only when condition met
**Gas Fee:** Cost to process transaction on blockchain (~0.03-0.05 ETH per action)
**Blockchain:** Immutable record of all transactions (can't be changed/deleted)
**MetaMask:** Your wallet - holds your ETH and approves transactions
**Testnet:** Practice network using fake ETH (no real money involved)
**Transaction Hash:** Unique ID of blockchain transaction (like receipt number)

---

## 🎓 Learning Resources

- MetaMask Help: https://support.metamask.io
- Ethereum Basics: https://ethereum.org/en/learn
- Sepolia Testnet Info: https://sepolia.etherscan.io
- Gas Fee Tracker: https://etherscan.io/gastracker

---

**You're all set! Follow the step-by-step workflows above and you'll complete transactions successfully!** 🚀
