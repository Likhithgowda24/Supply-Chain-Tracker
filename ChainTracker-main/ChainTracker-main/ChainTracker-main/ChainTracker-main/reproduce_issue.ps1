
function Log-Output {
    param([string]$Message)
    Add-Content -Path "repro_result.txt" -Value $Message
}

$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
if (Test-Path "repro_result.txt") { Remove-Item "repro_result.txt" }

# 1. Register Manufacturer
Log-Output "1. Registering Manufacturer..."
$manufName = "manuf_rep_$timestamp"
$manufEmail = "manuf_rep_$timestamp@example.com"
$manufBody = @{ username = $manufName; email = $manufEmail; password = "password123"; role = "manufacturer"; securityQuestion = "q"; securityAnswer = "a" } | ConvertTo-Json
try {
    $manufReg = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/signup" -Method Post -Body $manufBody -ContentType "application/json"
    $manufToken = $manufReg.accessToken
    $manufId = $manufReg.user.id
    Log-Output "   Manufacturer Registered: $manufId"
} catch {
    Log-Output "Manufacturer Registration Failed: $_"
    exit 1
}

# 2. Register Supplier (The User)
Log-Output "2. Registering Supplier (User)..."
$suppName = "supp_rep_$timestamp"
$suppEmail = "supp_rep_$timestamp@example.com"
$suppBody = @{ username = $suppName; email = $suppEmail; password = "password123"; role = "supplier"; securityQuestion = "q"; securityAnswer = "a" } | ConvertTo-Json
try {
    $suppReg = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/signup" -Method Post -Body $suppBody -ContentType "application/json"
    $suppToken = $suppReg.accessToken
    $suppUserId = $suppReg.user.id
    Log-Output "   Supplier User Registered: $suppUserId"
} catch {
    Log-Output "Supplier Registration Failed: $_"
    exit 1
}

# 3. Manufacturer creates a Product and Order (to have something to assign)
Log-Output "3. Creating Product and Order..."
$prodBody = @{ productId = "PROD-REP-$timestamp"; name = "Repro Product"; description = "Desc"; price = 50; stock = 100; category = "Test" } | ConvertTo-Json
$prodReg = Invoke-RestMethod -Uri "http://localhost:5001/api/products" -Method Post -Body $prodBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $manufToken" }
$prodId = $prodReg.productId

# We need a customer to place an order, or we can just create one directly if we had a manufacturer-create-order endpoint,
# but the system only allows customers to place orders.
# Let's quickly register a customer.
$custBody = @{ username = "cust_rep_$timestamp"; email = "cust_rep_$timestamp@example.com"; password = "password123"; role = "customer"; securityQuestion = "q"; securityAnswer = "a" } | ConvertTo-Json
$custReg = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/signup" -Method Post -Body $custBody -ContentType "application/json"
$custToken = $custReg.accessToken

$orderBody = @{ productId = $prodId; quantity = 1; shippingAddress = "Addr"; location = "Loc" } | ConvertTo-Json
$orderReg = Invoke-RestMethod -Uri "http://localhost:5001/api/orders" -Method Post -Body $orderBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $custToken" }
$orderId = $orderReg.orderId
Log-Output "   Order Created: $orderId"

# 4. Manufacturer adds Supplier (Contact)
# This is what happens in the UI usually. The manufacturer adds a supplier to their list.
Log-Output "4. Manufacturer adding Supplier Contact..."
$addSuppBody = @{ name = $suppName; email = $suppEmail; phone = "1234567890"; company = "Supp Co"; location = "Loc" } | ConvertTo-Json
try {
    $addedSupp = Invoke-RestMethod -Uri "http://localhost:5001/api/manufacturer/suppliers" -Method Post -Body $addSuppBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $manufToken" }
    $addedSuppId = $addedSupp.id
    Log-Output "   Supplier Contact Added: $addedSuppId"
} catch {
    Log-Output "Add Supplier Failed: $_"
    exit 1
}

# 5. Manufacturer assigns order to Supplier
# CASE A: Manufacturer sends the ID of the "Supplier Contact" ($addedSuppId)
Log-Output "5. Assigning Order (using Contact ID)..."
$assignBody = @{ orderId = $orderId; supplierIds = @($addedSuppId) } | ConvertTo-Json
try {
    $assignResp = Invoke-RestMethod -Uri "http://localhost:5001/api/manufacturer/send-order" -Method Post -Body $assignBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $manufToken" }
    Log-Output "   Assignment Response: $($assignResp | ConvertTo-Json -Depth 5)"
} catch {
    Log-Output "Assignment Failed: $_"
    # Don't exit, we want to see if it failed as expected
}

# 6. Check Supplier Dashboard
Log-Output "6. Checking Supplier Dashboard (as User)..."
try {
    $dashResp = Invoke-RestMethod -Uri "http://localhost:5001/api/supplier/assigned-orders" -Method Get -Headers @{ Authorization = "Bearer $suppToken" }
    Log-Output "   Assigned Orders Count: $($dashResp.Count)"
    if ($dashResp.Count -eq 0) {
        Log-Output "   ISSUE REPRODUCED: No orders found for supplier."
    } else {
        Log-Output "   Orders Found! Fix Verified."
    }
} catch {
    Log-Output "Check Dashboard Failed: $_"
}
