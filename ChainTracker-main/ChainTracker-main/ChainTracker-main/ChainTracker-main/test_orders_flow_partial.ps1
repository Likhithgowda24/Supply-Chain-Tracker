
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'

# 1. Create Manufacturer and Product (Reuse logic or just do it again to be self-contained)
Write-Host "1. Setup: Creating Manufacturer and Product..."
$manufName = "manuf_ord_$timestamp"
$manufEmail = "manuf_ord_$timestamp@example.com"
$manufBody = @{ username = $manufName; email = $manufEmail; password = "password123"; role = "manufacturer"; securityQuestion = "q"; securityAnswer = "a" } | ConvertTo-Json
$manufReg = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/signup" -Method Post -Body $manufBody -ContentType "application/json"
$manufToken = $manufReg.accessToken

$prodId = "PROD-ORD-$timestamp"
$prodBody = @{ productId = $prodId; name = "Order Test Product"; description = "Desc"; price = 50; stock = 100; category = "Test" } | ConvertTo-Json
$prodReg = Invoke-RestMethod -Uri "http://localhost:5001/api/products" -Method Post -Body $prodBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $manufToken" }
$productDbId = $prodReg.id
Write-Host "   Product Created: $productDbId"

# 2. Create Customer
Write-Host "2. Registering Customer..."
$custName = "cust_ord_$timestamp"
$custEmail = "cust_ord_$timestamp@example.com"
$custBody = @{ username = $custName; email = $custEmail; password = "password123"; role = "customer"; securityQuestion = "q"; securityAnswer = "a" } | ConvertTo-Json
$custReg = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/signup" -Method Post -Body $custBody -ContentType "application/json"
$custToken = $custReg.accessToken
Write-Host "   Customer Registered."

# 3. Place Order
Write-Host "3. Placing Order..."
# Need to find the order endpoint structure. Usually POST /api/orders
# Let's assume standard structure based on schema: items array with productId and quantity
$orderBody = @{
    items = @(
        @{ productId = $productDbId; quantity = 2 }
    )
    totalPrice = 100 # Frontend usually calculates, backend validates
    shippingAddress = "123 Test St"
} | ConvertTo-Json

# Wait, I need to check routes.ts for the exact order creation endpoint and payload
# I'll pause writing the script to check routes.ts again for order creation.
