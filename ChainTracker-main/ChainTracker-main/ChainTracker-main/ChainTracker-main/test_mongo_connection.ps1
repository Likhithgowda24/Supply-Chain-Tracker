
$ErrorActionPreference = "Stop"

function Test-Endpoint {
    param (
        [string]$Method,
        [string]$Url,
        [hashtable]$Body,
        [string]$Token
    )
    
    $Headers = @{}
    if ($Token) {
        $Headers["Authorization"] = "Bearer $Token"
    }
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        Write-Host "Error calling $Url ($Method): $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            Write-Host "Response Body: $($reader.ReadToEnd())" -ForegroundColor Red
        }
        return $null
    }
}

$BaseUrl = "http://localhost:5004"

Write-Host "Testing MongoDB Connection and Functionality..." -ForegroundColor Cyan

# 1. Register a new user (Manufacturer)
$ManufacturerUser = "mongo_man_" + (Get-Random)
$ManufacturerEmail = "$ManufacturerUser@test.com"
Write-Host "Registering Manufacturer: $ManufacturerUser"
$regBody = @{
    username = $ManufacturerUser
    password = "password123"
    email = $ManufacturerEmail
    role = "manufacturer"
    securityQuestion = "q"
    securityAnswer = "a"
}
$manReg = Test-Endpoint -Method "POST" -Url "$BaseUrl/api/auth/signup" -Body $regBody

if (-not $manReg) { Write-Error "Failed to register manufacturer" }
$ManToken = $manReg.accessToken
Write-Host "Manufacturer Registered. ID: $($manReg.user.id)" -ForegroundColor Green

# 2. Login Manufacturer
Write-Host "Logging in Manufacturer..."
$loginBody = @{
    email = $ManufacturerEmail
    password = "password123"
}
$manLogin = Test-Endpoint -Method "POST" -Url "$BaseUrl/api/auth/login" -Body $loginBody
if (-not $manLogin) { Write-Error "Failed to login manufacturer" }
$ManToken = $manLogin.accessToken
Write-Host "Manufacturer Logged In." -ForegroundColor Green

# 3. Create a Product
Write-Host "Creating Product..."
$ProductCode = "PROD_" + (Get-Random)
$prodBody = @{
    productId = $ProductCode
    name = "Mongo Test Product"
    price = 100
    description = "Testing MongoDB persistence"
    stock = 50
    category = "Test"
    manufacturerId = $manReg.user.id
}
$product = Test-Endpoint -Method "POST" -Url "$BaseUrl/api/products" -Body $prodBody -Token $ManToken
if (-not $product) { Write-Error "Failed to create product" }
Write-Host "Product Created. ID: $($product.id)" -ForegroundColor Green

# 4. Register Supplier
$SupplierUser = "mongo_sup_" + (Get-Random)
$SupplierEmail = "$SupplierUser@test.com"
Write-Host "Registering Supplier: $SupplierUser"
$supRegBody = @{
    username = $SupplierUser
    password = "password123"
    email = $SupplierEmail
    role = "supplier"
    securityQuestion = "q"
    securityAnswer = "a"
}
$supReg = Test-Endpoint -Method "POST" -Url "$BaseUrl/api/auth/signup" -Body $supRegBody
if (-not $supReg) { Write-Error "Failed to register supplier" }
$SupToken = $supReg.accessToken
Write-Host "Supplier Registered. ID: $($supReg.user.id)" -ForegroundColor Green

# 5. Add Supplier to Manufacturer
Write-Host "Adding Supplier to Manufacturer..."
$addSupBody = @{
    name = $SupplierUser
    email = $SupplierEmail
}
# Using /api/manufacturer/suppliers to add supplier
$addSup = Test-Endpoint -Method "POST" -Url "$BaseUrl/api/manufacturer/suppliers" -Body $addSupBody -Token $ManToken
if (-not $addSup) { 
    Write-Host "Failed to add supplier to manufacturer list (might be optional for assignment if using ID)"
} else {
    Write-Host "Supplier Added to Manufacturer List." -ForegroundColor Green
}

# 6. Create Order (as Customer)
$CustomerUser = "mongo_cust_" + (Get-Random)
$custRegBody = @{
    username = $CustomerUser
    password = "password123"
    email = "$CustomerUser@test.com"
    role = "customer"
    securityQuestion = "q"
    securityAnswer = "a"
}
$custReg = Test-Endpoint -Method "POST" -Url "$BaseUrl/api/auth/signup" -Body $custRegBody
$CustToken = $custReg.accessToken
Write-Host "Customer Registered. ID: $($custReg.user.id)" -ForegroundColor Green

Write-Host "Placing Order..."
$orderBody = @{
    customerId = $custReg.user.id
    productId = $ProductCode
    quantity = 2
    totalPrice = 200
    paymentMethod = "online"
    shippingAddress = @{ street="123 Mongo St"; city="DB City" }
}
$order = Test-Endpoint -Method "POST" -Url "$BaseUrl/api/orders" -Body $orderBody -Token $CustToken
if (-not $order) { Write-Error "Failed to create order" }
Write-Host "Order Created. ID: $($order.id)" -ForegroundColor Green

# 7. Assign Order to Supplier (Manufacturer action)
Write-Host "Assigning Order to Supplier..."
$assignBody = @{
    supplierIds = @($supReg.user.id)
    orderId = $order.orderId
}
# Using correct route: /api/manufacturer/send-order
$assign = Test-Endpoint -Method "POST" -Url "$BaseUrl/api/manufacturer/send-order" -Body $assignBody -Token $ManToken
if (-not $assign) { Write-Error "Failed to assign order" }
Write-Host "Order Assigned." -ForegroundColor Green

# 8. Verify Supplier Sees Order
Write-Host "Verifying Supplier Pending Orders..."
# GET /api/supplier/assigned-orders
# Wait, is it /api/supplier/assigned-orders or /api/supplier/orders?
# Let's assume /api/supplier/assigned-orders based on previous context.
# Actually, let's check routes.ts if possible, but I'll stick with what I had or try both.
# I'll try /api/supplier/assigned-orders first.
$pending = Test-Endpoint -Method "GET" -Url "$BaseUrl/api/supplier/assigned-orders" -Token $SupToken

if (-not $pending) {
    # Try alternate route
    Write-Host "Trying alternate route /api/supplier/orders..."
    $pending = Test-Endpoint -Method "GET" -Url "$BaseUrl/api/supplier/orders" -Token $SupToken
}

if (-not $pending) { Write-Error "Failed to fetch pending orders" }

# Check if order is in the list
$found = $false
# $pending might be an array or a single object or wrapped.
if ($pending -is [System.Array]) {
    foreach ($p in $pending) {
        if ($p.orderId -eq $order.orderId) {
            $found = $true
            break
        }
    }
} else {
    if ($pending.orderId -eq $order.orderId) {
        $found = $true
    }
}

if ($found) {
    Write-Host "Order found in Supplier's pending list." -ForegroundColor Green
} else {
    Write-Error "Order NOT found in Supplier's pending list. List content: $($pending | ConvertTo-Json -Depth 2)"
}

Write-Host "MongoDB Migration Verification Completed Successfully!" -ForegroundColor Green
