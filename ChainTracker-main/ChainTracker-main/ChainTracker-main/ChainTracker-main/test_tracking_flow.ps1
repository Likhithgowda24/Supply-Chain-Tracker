
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
$mName = "Mfg_Track_$(Get-Random)"
$mUser = Invoke-Api -Method POST -Uri "/api/auth/signup" -Body @{ username = $mName; email = "$mName@test.com"; password = "password123"; role = "manufacturer"; securityQuestion = "q"; securityAnswer = "a" }
$mToken = $mUser.accessToken
$mId = $mUser.user.id

$sName = "Supp_Track_$(Get-Random)"
$sUser = Invoke-Api -Method POST -Uri "/api/auth/signup" -Body @{ username = $sName; email = "$sName@test.com"; password = "password123"; role = "supplier"; securityQuestion = "q"; securityAnswer = "a" }
$sToken = $sUser.accessToken
$sId = $sUser.user.id

Invoke-Api -Method POST -Uri "/api/manufacturer/suppliers" -Token $mToken -Body @{ id = $sId; name = $sName; email = "$sName@test.com" } | Out-Null

$cName = "Cust_Track_$(Get-Random)"
$cUser = Invoke-Api -Method POST -Uri "/api/auth/signup" -Body @{ username = $cName; email = "$cName@test.com"; password = "password123"; role = "customer"; securityQuestion = "q"; securityAnswer = "a" }
$cToken = $cUser.accessToken

# 2. Create Product & Order
Write-Host "--- Creating Product & Order ---"
$prodId = "PROD-TRACK-$(Get-Random)"
$product = Invoke-Api -Method POST -Uri "/api/products" -Token $mToken -Body @{ productId = $prodId; name = "Tracking Widget"; description = "Test"; price = 100; stock = 100 }

$order = Invoke-Api -Method POST -Uri "/api/orders" -Token $cToken -Body @{ productId = $prodId; quantity = 1; totalPrice = 100 }
$orderId = $order.orderId
Write-Host "Order Created: $orderId (Status: $($order.status))"

# 3. Assign Order
Write-Host "--- Assigning Order ---"
Invoke-Api -Method POST -Uri "/api/manufacturer/send-order" -Token $mToken -Body @{ orderId = $orderId; supplierIds = @($sId) } | Out-Null

# 4. Verify Initial Status (Should be 'placed' in main order, 'pending_acceptance' in assigned)
$mainOrderBefore = Invoke-Api -Method GET -Uri "/api/orders/$orderId"
Write-Host "Main Order Status Before Accept: $($mainOrderBefore.status)"

# 5. Accept Order
Write-Host "--- Accepting Order ---"
Invoke-Api -Method POST -Uri "/api/supplier/accept-order/$orderId" -Token $sToken | Out-Null

# 6. Verify Final Status (Should be 'accepted' in main order)
$mainOrderAfter = Invoke-Api -Method GET -Uri "/api/orders/$orderId"
Write-Host "Main Order Status After Accept: $($mainOrderAfter.status)"

if ($mainOrderAfter.status -eq "accepted") {
    Write-Host "SUCCESS: Main order status updated to 'accepted'" -ForegroundColor Green
} else {
    Write-Host "FAILURE: Main order status is '$($mainOrderAfter.status)' (Expected: 'accepted')" -ForegroundColor Red
    exit 1
}
