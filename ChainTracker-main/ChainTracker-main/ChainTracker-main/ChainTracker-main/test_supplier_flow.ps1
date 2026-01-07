
$baseUrl = "http://localhost:5001"

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Uri,
        [hashtable]$Body = @{},
        [string]$Token
    )
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    
    try {
        $params = @{
            Method = $Method
            Uri = "$baseUrl$Uri"
            Headers = $headers
        }
        if ($Body.Count -gt 0) { $params["Body"] = ($Body | ConvertTo-Json -Depth 10) }
        
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        Write-Host "Error calling $Uri : $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            Write-Host "Response Body: $($reader.ReadToEnd())" -ForegroundColor Yellow
        }
        return $null
    }
}

# 1. Create Manufacturer
$mName = "Mfg_$(Get-Random)"
$mEmail = "$mName@test.com"
Write-Host "Creating Manufacturer: $mName"
$mUser = Invoke-Api -Method POST -Uri "/api/auth/signup" -Body @{
    username = $mName
    email = $mEmail
    password = "password123"
    role = "manufacturer"
    securityQuestion = "q"
    securityAnswer = "a"
}
$mToken = $mUser.accessToken
$mId = $mUser.user.id

# 2. Create Supplier
$sName = "Supp_$(Get-Random)"
$sEmail = "$sName@test.com"
Write-Host "Creating Supplier: $sName"
$sUser = Invoke-Api -Method POST -Uri "/api/auth/signup" -Body @{
    username = $sName
    email = $sEmail
    password = "password123"
    role = "supplier"
    securityQuestion = "q"
    securityAnswer = "a"
}
$sToken = $sUser.accessToken
$sId = $sUser.user.id

# 3. Add Supplier to Manufacturer's list
Write-Host "Adding Supplier to Manufacturer's list"
Invoke-Api -Method POST -Uri "/api/manufacturer/suppliers" -Token $mToken -Body @{
    id = $sId
    name = $sName
    email = $sEmail
} | Out-Null

# 4. Create Product
Write-Host "Creating Product"
$prodId = "PROD-$(Get-Random)"
$product = Invoke-Api -Method POST -Uri "/api/products" -Token $mToken -Body @{
    productId = $prodId
    name = "Test Widget"
    description = "A test widget"
    price = 100
    stock = 100
}
if (-not $product -or -not $product.productId) {
    Write-Host "FAILURE: Failed to create product" -ForegroundColor Red
    exit 1
}
Write-Host "Product Created: $($product.productId)"

# 5. Create Order (Customer)
$cName = "Cust_$(Get-Random)"
$cEmail = "$cName@test.com"
Write-Host "Creating Customer: $cName"
$cUser = Invoke-Api -Method POST -Uri "/api/auth/signup" -Body @{
    username = $cName
    email = $cEmail
    password = "password123"
    role = "customer"
    securityQuestion = "q"
    securityAnswer = "a"
}
$cToken = $cUser.accessToken

Write-Host "Creating Order"
$order = Invoke-Api -Method POST -Uri "/api/orders" -Token $cToken -Body @{
    productId = $product.productId
    quantity = 5
    totalPrice = 500
}
Write-Host "Order Response: $($order | ConvertTo-Json -Depth 5)"

if (-not $order -or -not $order.orderId) {
    Write-Host "FAILURE: Failed to create order" -ForegroundColor Red
    exit 1
}
$orderId = $order.orderId
Write-Host "Order Created: $orderId"

# 6. Assign Order to Supplier
Write-Host "Assigning Order $orderId to Supplier"
$assignRes = Invoke-Api -Method POST -Uri "/api/manufacturer/send-order" -Token $mToken -Body @{
    orderId = $orderId
    supplierIds = @($sId)
}
Write-Host "Assign Response: $($assignRes | ConvertTo-Json -Depth 5)"

# 7. Verify Pending Order for Supplier
Write-Host "Verifying Pending Order for Supplier"
$pendingOrders = Invoke-Api -Method GET -Uri "/api/supplier/pending-orders" -Token $sToken
Write-Host "Pending Orders: $($pendingOrders | ConvertTo-Json -Depth 5)"

$targetOrder = $pendingOrders | Where-Object { $_.orderId -eq $orderId }

if ($targetOrder) {
    Write-Host "SUCCESS: Order found in pending list with status: $($targetOrder.status)" -ForegroundColor Green
} else {
    Write-Host "FAILURE: Order not found in pending list" -ForegroundColor Red
    exit 1
}

# 8. Accept Order
Write-Host "Accepting Order"
Invoke-Api -Method POST -Uri "/api/supplier/accept-order/$orderId" -Token $sToken | Out-Null

# 9. Verify Order Accepted
Write-Host "Verifying Order Accepted"
$assignedOrders = Invoke-Api -Method GET -Uri "/api/supplier/assigned-orders" -Token $sToken
$acceptedOrder = $assignedOrders | Where-Object { $_.orderId -eq $orderId }

if ($acceptedOrder.status -eq "accepted") {
    Write-Host "SUCCESS: Order status is 'accepted'" -ForegroundColor Green
} else {
    Write-Host "FAILURE: Order status is $($acceptedOrder.status)" -ForegroundColor Red
}

# 10. Test Decline Flow
Write-Host "--- Testing Decline Flow ---"
# Create another order
Write-Host "Creating Second Order"
$order2 = Invoke-Api -Method POST -Uri "/api/orders" -Token $cToken -Body @{
    productId = $product.productId
    quantity = 3
    totalPrice = 300
}
$orderId2 = $order2.orderId
Write-Host "Order 2 Created: $orderId2"

# Assign Order 2
Write-Host "Assigning Order 2 to Supplier"
Invoke-Api -Method POST -Uri "/api/manufacturer/send-order" -Token $mToken -Body @{
    orderId = $orderId2
    supplierIds = @($sId)
} | Out-Null

# Verify Pending
$pendingOrders2 = Invoke-Api -Method GET -Uri "/api/supplier/pending-orders" -Token $sToken
$targetOrder2 = $pendingOrders2 | Where-Object { $_.orderId -eq $orderId2 }
if ($targetOrder2) {
    Write-Host "SUCCESS: Order 2 found in pending list" -ForegroundColor Green
} else {
    Write-Host "FAILURE: Order 2 not found in pending list" -ForegroundColor Red
    exit 1
}

# Decline Order
Write-Host "Declining Order 2"
Invoke-Api -Method POST -Uri "/api/supplier/decline-order/$orderId2" -Token $sToken | Out-Null

# Verify Removed
Write-Host "Verifying Order 2 Removed"
$assignedOrders2 = Invoke-Api -Method GET -Uri "/api/supplier/assigned-orders" -Token $sToken
$declinedOrder = $assignedOrders2 | Where-Object { $_.orderId -eq $orderId2 }

if (-not $declinedOrder) {
    Write-Host "SUCCESS: Order 2 removed from assigned list" -ForegroundColor Green
} else {
    Write-Host "FAILURE: Order 2 still present in assigned list" -ForegroundColor Red
}

Write-Host "All Tests Complete"
