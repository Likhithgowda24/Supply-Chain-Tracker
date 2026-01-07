
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

# 1. Setup Users
Write-Host "--- Setting up Users ---"
$mName = "Mfg_Notify_$(Get-Random)"
$mUser = Invoke-Api -Method POST -Uri "/api/auth/signup" -Body @{ username = $mName; email = "$mName@test.com"; password = "password123"; role = "manufacturer"; securityQuestion = "q"; securityAnswer = "a" }
$mToken = $mUser.accessToken
$mId = $mUser.user.id

$sName = "Supp_Notify_$(Get-Random)"
$sUser = Invoke-Api -Method POST -Uri "/api/auth/signup" -Body @{ username = $sName; email = "$sName@test.com"; password = "password123"; role = "supplier"; securityQuestion = "q"; securityAnswer = "a" }
$sToken = $sUser.accessToken
$sId = $sUser.user.id

Invoke-Api -Method POST -Uri "/api/manufacturer/suppliers" -Token $mToken -Body @{ id = $sId; name = $sName; email = "$sName@test.com" } | Out-Null

$cName = "Cust_Notify_$(Get-Random)"
$cUser = Invoke-Api -Method POST -Uri "/api/auth/signup" -Body @{ username = $cName; email = "$cName@test.com"; password = "password123"; role = "customer"; securityQuestion = "q"; securityAnswer = "a" }
$cToken = $cUser.accessToken
$cId = $cUser.user.id

# 2. Create Product & Order
Write-Host "--- Creating Product & Order ---"
$prodId = "PROD-NOTIFY-$(Get-Random)"
$product = Invoke-Api -Method POST -Uri "/api/products" -Token $mToken -Body @{ productId = $prodId; name = "Notify Widget"; description = "Test"; price = 100; stock = 100 }

$order = Invoke-Api -Method POST -Uri "/api/orders" -Token $cToken -Body @{ productId = $prodId; quantity = 1; totalPrice = 100 }
$orderId = $order.orderId
Write-Host "Order Created: $orderId"

# 3. Assign Order
Write-Host "--- Assigning Order ---"
Invoke-Api -Method POST -Uri "/api/manufacturer/send-order" -Token $mToken -Body @{ orderId = $orderId; supplierIds = @($sId) } | Out-Null

# 4. Accept Order (Should trigger notifications)
Write-Host "--- Accepting Order ---"
Invoke-Api -Method POST -Uri "/api/supplier/accept-order/$orderId" -Token $sToken | Out-Null

# Verify Notifications for Manufacturer
$mNotifs = Invoke-Api -Method GET -Uri "/api/notifications" -Token $mToken
$acceptNotifM = $mNotifs | Where-Object { $_.payload.orderId -eq $orderId -and $_.type -eq "order_accepted" }
if ($acceptNotifM) { Write-Host "SUCCESS: Manufacturer received 'order_accepted' notification" -ForegroundColor Green }
else { Write-Host "FAILURE: Manufacturer did NOT receive 'order_accepted' notification" -ForegroundColor Red }

# Verify Notifications for Customer
$cNotifs = Invoke-Api -Method GET -Uri "/api/notifications" -Token $cToken
$acceptNotifC = $cNotifs | Where-Object { $_.payload.orderId -eq $orderId -and $_.type -eq "order_update" -and $_.payload.status -eq "accepted" }
if ($acceptNotifC) { Write-Host "SUCCESS: Customer received 'order_update' (accepted) notification" -ForegroundColor Green }
else { Write-Host "FAILURE: Customer did NOT receive 'order_update' (accepted) notification" -ForegroundColor Red }

# 5. Update Order Status to 'shipped'
Write-Host "--- Updating Status to 'shipped' ---"
Invoke-Api -Method POST -Uri "/api/supplier/update-order-status/$orderId" -Token $sToken -Body @{ status = "shipped" } | Out-Null

# Verify Main Order Status
$mainOrder = Invoke-Api -Method GET -Uri "/api/orders/$orderId"
if ($mainOrder.status -eq "shipped") { Write-Host "SUCCESS: Main order status updated to 'shipped'" -ForegroundColor Green }
else { Write-Host "FAILURE: Main order status is '$($mainOrder.status)'" -ForegroundColor Red }

# Verify Notifications for Manufacturer
$mNotifs2 = Invoke-Api -Method GET -Uri "/api/notifications" -Token $mToken
$shipNotifM = $mNotifs2 | Where-Object { $_.payload.orderId -eq $orderId -and $_.type -eq "order_status_update" -and $_.payload.status -eq "shipped" }
if ($shipNotifM) { Write-Host "SUCCESS: Manufacturer received 'order_status_update' (shipped) notification" -ForegroundColor Green }
else { Write-Host "FAILURE: Manufacturer did NOT receive 'order_status_update' (shipped) notification" -ForegroundColor Red }

# Verify Notifications for Customer
$cNotifs2 = Invoke-Api -Method GET -Uri "/api/notifications" -Token $cToken
$shipNotifC = $cNotifs2 | Where-Object { $_.payload.orderId -eq $orderId -and $_.type -eq "order_update" -and $_.payload.status -eq "shipped" }
if ($shipNotifC) { Write-Host "SUCCESS: Customer received 'order_update' (shipped) notification" -ForegroundColor Green }
else { Write-Host "FAILURE: Customer did NOT receive 'order_update' (shipped) notification" -ForegroundColor Red }

Write-Host "All Tests Complete"
