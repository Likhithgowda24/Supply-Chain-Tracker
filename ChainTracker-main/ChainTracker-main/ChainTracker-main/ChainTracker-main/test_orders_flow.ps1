
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'

# 1. Create Manufacturer and Product
Write-Host "1. Setup: Creating Manufacturer and Product..."
$manufName = "manuf_ord_$timestamp"
$manufEmail = "manuf_ord_$timestamp@example.com"
$manufBody = @{ username = $manufName; email = $manufEmail; password = "password123"; role = "manufacturer"; securityQuestion = "q"; securityAnswer = "a" } | ConvertTo-Json
try {
    $manufReg = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/signup" -Method Post -Body $manufBody -ContentType "application/json"
    $manufToken = $manufReg.accessToken
} catch {
    Write-Host "Manufacturer Registration Failed: $_"
    exit 1
}

$prodId = "PROD-ORD-$timestamp"
$prodBody = @{ productId = $prodId; name = "Order Test Product"; description = "Desc"; price = 50; stock = 100; category = "Test" } | ConvertTo-Json
try {
    $prodReg = Invoke-RestMethod -Uri "http://localhost:5001/api/products" -Method Post -Body $prodBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $manufToken" }
    $productDbId = $prodReg.productId # The endpoint returns the created product object, which has productId
    Write-Host "   Product Created: $productDbId"
} catch {
    Write-Host "Product Creation Failed: $_"
    exit 1
}

# 2. Create Customer
Write-Host "2. Registering Customer..."
$custName = "cust_ord_$timestamp"
$custEmail = "cust_ord_$timestamp@example.com"
$custBody = @{ username = $custName; email = $custEmail; password = "password123"; role = "customer"; securityQuestion = "q"; securityAnswer = "a" } | ConvertTo-Json
try {
    $custReg = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/signup" -Method Post -Body $custBody -ContentType "application/json"
    $custToken = $custReg.accessToken
    Write-Host "   Customer Registered."
} catch {
    Write-Host "Customer Registration Failed: $_"
    exit 1
}

# 3. Place Order
Write-Host "3. Placing Order..."
$orderBody = @{
    productId = $productDbId
    quantity = 2
    shippingAddress = "123 Test St"
    location = "Test City"
} | ConvertTo-Json

try {
    $orderReg = Invoke-RestMethod -Uri "http://localhost:5001/api/orders" -Method Post -Body $orderBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $custToken" }
    Write-Host "   Order Placed! Order ID: $($orderReg.orderId)"
    Write-Host "   Total Price: $($orderReg.totalPrice)"
} catch {
    Write-Host "Order Placement Failed: $_"
    exit 1
}

Write-Host "Order Flow Verified!"
