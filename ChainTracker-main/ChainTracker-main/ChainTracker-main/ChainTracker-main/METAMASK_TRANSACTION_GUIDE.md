# Complete MetaMask Transaction Guide - Step by Step

## What is MetaMask?
MetaMask is a **digital wallet** that holds your cryptocurrency (ETH) and allows you to approve transactions on blockchain. Think of it like a bank account that you approve transactions from.

---

## 🔴 CRITICAL: Before You Start

### 1. MetaMask Must Be Installed
- Check your browser's top-right corner
- Look for the **orange/red fox icon** (MetaMask)
- If you don't see it → Go to https://metamask.io → Install it
- If you see it → Continue to Step 2

### 2. You Must Be On Sepolia Testnet
- Click the **MetaMask icon** in your browser
- Look at the **TOP** of the popup - it shows your network
- You should see: **"Sepolia"**
- If you see something else (like "Ethereum Mainnet"):
  - Click on the network name
  - Select **"Sepolia"**
  - If "Sepolia" doesn't appear, go to https://sepoliafaucet.com and get test ETH

### 3. You Must Have Test ETH
- Click the **MetaMask icon**
- Look at your balance (should say something like "1.5 ETH")
- If it says "0 ETH" → Go to https://sepoliafaucet.com
  - Enter your wallet address
  - Click "Send Sepolia ETH"
  - Wait 1-2 minutes
  - You should now have ~0.5 ETH

---

## 📱 STEP 1: Connect Your Wallet to the App

### In the App:
1. Look at the **TOP RIGHT** corner
2. You should see a **"Connect Wallet"** button (wallet icon)
3. Click it

### What Happens:
- MetaMask popup appears
- Shows your account(s)
- Shows a blue "Connect" button

### You Do:
1. Look at the list of accounts (usually just one)
2. Make sure it's the account you want (shows wallet address)
3. Click the blue **"Connect"** button
4. MetaMask popup closes

### After Connect:
- Top right now shows your wallet address (shortened, like "0x1234...5678")
- Shows your ETH balance (like "1.5 ETH")
- Green checkmark ✅ appears

---

## 💰 STEP 2: Understand Transaction Types

You'll do 4 different types of transactions:

| Transaction | Who Does It | What It Does | Cost |
|-------------|-----------|------------|------|
| **Create Order** | Manufacturer | Lock funds in escrow | ~0.05 ETH |
| **Accept Order** | Supplier | Claim exclusive right to order | ~0.03 ETH |
| **Mark Shipped** | Supplier | Record shipment on blockchain | ~0.04 ETH |
| **Confirm Delivery** | Customer | Release payment to supplier | ~0.03 ETH |

---

## 🚀 STEP 3: How to Execute a Transaction (Using Create Order as Example)

### PART A: Before MetaMask Popup Appears

**In the App:**

1. Navigate to **Orders page**
2. Click **"+ Create Order"** button
3. A **form appears** with fields:
   - Select Supplier (dropdown)
   - Select Product (dropdown)
   - Enter Quantity (number)
   - Enter Price Per Unit (number)

4. Fill in the form:
   ```
   Supplier:        John's Supply Co
   Product:         Widget A
   Quantity:        100
   Price Per Unit:  0.01 ETH
   
   Total Will Be:   100 × 0.01 = 1.0 ETH
   Gas Fee Est:     ~0.05 ETH
   Total Cost:      ~1.05 ETH
   ```

5. Review the form - Make sure everything is correct ⚠️ IMPORTANT

6. Click the **blue "Create Order & Lock Funds"** button at the bottom

### PART B: Confirmation Dialog Appears

**What You See:**
```
┌────────────────────────────────────────┐
│  Confirm Order Creation                │
├────────────────────────────────────────┤
│  Supplier:       John's Supply Co      │
│  Product:        Widget A              │
│  Quantity:       100 units             │
│  Unit Price:     0.01 ETH              │
│  Total Price:    1.0 ETH               │
│  Gas Fee:        ~0.05 ETH             │
│  ────────────────────────────────      │
│  TOTAL COST:     ~1.05 ETH             │
├────────────────────────────────────────┤
│  [Cancel]              [Confirm & Pay]  │
└────────────────────────────────────────┘
```

**What You Do:**
- Review the numbers ONE MORE TIME ✅
- Make sure the amount is what you want to spend
- Click the **blue "Confirm & Pay"** button

### PART C: MetaMask Popup Appears (THE CRITICAL PART!)

**What You See in MetaMask:**

```
┌─────────────────────────────────────┐
│  MetaMask - Review Transaction      │
├─────────────────────────────────────┤
│                                     │
│  From:  0x1234...5678  ← YOUR ACC  │
│         Your Account               │
│                                     │
│  To:    0xABCD...EFGH              │
│         Contract Address           │
│                                     │
│  Amount:  0 ETH                     │
│          (funds go to escrow)      │
│                                     │
│  Gas Fee: 0.0002 ETH               │
│  Gas Limit: 200,000 gas            │
│                                     │
│  ═════════════════════════════      │
│  Total: 0.0002 ETH                 │
│                                     │
│  ⚠️  Data (hex):                   │
│  0x4a23... (long code)             │
│                                     │
├─────────────────────────────────────┤
│  [Reject]         [Approve]         │
│  (Red/Gray)       (Blue)            │
└─────────────────────────────────────┘
```

### PART D: You Approve the Transaction (THIS IS THE KEY STEP!)

**What You Do:**
1. **Review the details** in MetaMask:
   - ✅ "From" = Your wallet address
   - ✅ "To" = Contract address (should be correct)
   - ✅ "Amount" = How much you're sending (usually 0 for escrow)
   - ✅ "Gas Fee" = Cost to process (~0.0002 ETH in this example)

2. **Click the Blue "Approve" Button** at the bottom right
   - This is the ONLY button you should click
   - The "Reject" button cancels the transaction (no money spent)

3. **Wait for MetaMask to Process**
   - You might see a "Processing" message
   - Don't close MetaMask or refresh the page
   - This takes 2-10 seconds usually

### PART E: Transaction is Submitted

**What You See:**
- MetaMask popup closes
- App shows: **"Transaction Submitted - Processing..."**
- A **loading animation** plays
- Shows a **transaction hash** (like "0x1234...5678")
- May show a link to view on **Etherscan** (blockchain explorer)

**What's Happening Behind the Scenes:**
- Your transaction is sent to the Ethereum network
- Miners/validators are processing it
- Money is being locked in escrow on blockchain
- This usually takes 10-60 seconds

### PART F: Success Message

**What You See:**
```
✅ ORDER CREATED SUCCESSFULLY!

Order ID:           SCT-1234567-ABCDE
Status:             Confirmed
Amount Locked:      1.0 ETH
Blockchain Hash:    0x1234...5678
Supplier:           John's Supply Co

[View Order Details]  [Create Another Order]
```

**What Happened:**
- ✅ Your 1.0 ETH is now LOCKED in escrow
- ✅ Order is recorded on blockchain
- ✅ Supplier can now see and accept this order
- ✅ Gas fee (~0.05 ETH) was deducted from your wallet
- ✅ Total spent: ~1.05 ETH

**Your Wallet Now Shows:**
- Balance reduced by ~1.05 ETH
- Example: If you had 2.0 ETH, now you have ~0.95 ETH

---

## ⚠️ TROUBLESHOOTING - What If Something Goes Wrong?

### Problem 1: MetaMask Popup Doesn't Appear
**Solution:**
- Check if MetaMask is installed (orange fox icon in top-right)
- Try refreshing the page (Ctrl+R or Cmd+R)
- Make sure MetaMask is unlocked (might need to enter password)
- Try the transaction again

### Problem 2: "Insufficient Funds" Error
**Solution:**
- You don't have enough ETH for the transaction + gas
- Go to https://sepoliafaucet.com
- Enter your wallet address
- Wait 1-2 minutes for test ETH to arrive
- Try transaction again

### Problem 3: Wrong Network Error
**Solution:**
- Click MetaMask icon
- Click the network dropdown (top of popup)
- Select "Sepolia"
- Try transaction again

### Problem 4: MetaMask Shows "0 ETH" Balance
**Solution:**
- Go to https://sepoliafaucet.com
- Enter your wallet address
- Click "Send Sepolia ETH"
- Wait 1-2 minutes
- Refresh MetaMask (click the refresh icon)
- You should now see balance

### Problem 5: "Transaction Rejected" Message in App
**Solution:**
- You clicked [Reject] in MetaMask instead of [Approve]
- This is normal - no money was spent
- Try the transaction again
- This time click [Approve] instead

### Problem 6: Transaction Shows "Pending" for 5+ Minutes
**Solution:**
- Network might be congested
- Wait a few more minutes (up to 10 minutes is normal)
- If still pending after 10 minutes:
  - Open MetaMask
  - Find the pending transaction
  - Click "Speed Up" to pay higher gas fee
  - Or click "Cancel" to retry

### Problem 7: I Approved But Nothing Happened
**Solution:**
- Check the browser console (F12)
- Look for red error messages
- Wait another 30 seconds (blockchain takes time)
- Try refreshing the page
- Check MetaMask to see transaction status

---

## 💡 Quick Reference Table

| Step | What You See | What You Do |
|------|------------|-----------|
| 1 | Form with fields | Fill the form |
| 2 | Confirmation dialog | Review and click "Confirm & Pay" |
| 3 | MetaMask popup | Click the blue "Approve" button |
| 4 | "Processing..." message | Wait 10-60 seconds |
| 5 | Success message | Transaction complete! ✅ |

---

## 🎯 Most Important Rules

1. ✅ **ALWAYS review MetaMask popup before clicking Approve**
2. ✅ **ALWAYS make sure you're on Sepolia network** (not mainnet)
3. ✅ **ALWAYS have enough ETH** (balance - amount - gas fee > 0)
4. ✅ **ALWAYS click [Approve] in MetaMask** (not Reject)
5. ✅ **ALWAYS wait for confirmation** (don't close page or refresh)

---

## 🚫 Common Mistakes to Avoid

❌ Clicking [Reject] instead of [Approve]
→ This cancels the transaction

❌ Clicking multiple times on the button
→ This creates multiple transactions (wastes ETH)

❌ Closing MetaMask while processing
→ This might cancel the transaction

❌ Changing networks in MetaMask mid-transaction
→ This causes the transaction to fail

❌ Going to a different website while processing
→ This might cancel your transaction

---

## 📊 Gas Fees Explained

**What is Gas?**
Gas is the cost to process a transaction on the blockchain. It's like a fee you pay to the network.

**Cost Breakdown:**
```
Gas Used:    200,000 gas
Gas Price:   1 Gwei
Total Cost:  200,000 × 1 = 200,000 Gwei = 0.0002 ETH
```

**Typical Costs in Our App:**
- Create Order:      ~0.05 ETH
- Accept Order:      ~0.03 ETH
- Mark Shipped:      ~0.04 ETH
- Confirm Delivery:  ~0.03 ETH
- **Total Per Order: ~0.15 ETH**

**Important:** Gas costs are in TEST ETH, not real money. You can get more free test ETH from the faucet anytime.

---

## ✅ You're Ready!

Now you understand:
1. ✅ How to connect wallet
2. ✅ What to do before MetaMask appears
3. ✅ What MetaMask popup shows
4. ✅ How to approve transactions
5. ✅ What happens after approval
6. ✅ How to handle errors

**Next Steps:**
1. Make sure MetaMask is installed
2. Make sure you're on Sepolia testnet
3. Make sure you have test ETH (from faucet)
4. Try creating your first order!

---

## 🆘 Still Stuck?

**Check This Order:**
1. MetaMask installed? ✅
2. On Sepolia testnet? ✅
3. Have test ETH? ✅
4. Wallet connected to app? ✅
5. Form filled correctly? ✅

If ALL checkboxes are ✅, try the transaction again!

---

**Good Luck! You've got this!** 🚀
