$baseUrl = "http://localhost:5001"

function Invoke-Api {
    param (
        [string]$Method,
        [string]$Uri,
        [hashtable]$Body = @{},
        [string]$Token
    )
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    
    $params = @{
        Method = $Method
        Uri = "$baseUrl$Uri"
        Headers = $headers
    }
    if ($Method -ne "GET" -and $Body.Count -gt 0) {
        $params["Body"] = $Body | ConvertTo-Json -Depth 10
    }

    try {
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        $err = "Error calling $Uri : $($_.Exception.Message)"
        Write-Host $err -ForegroundColor Red
        Add-Content -Path "race_log.txt" -Value $err
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $body = $reader.ReadToEnd()
            Write-Host "Response Body: $body" -ForegroundColor Red
            Add-Content -Path "race_log.txt" -Value "Response Body: $body"
        }
        return $null
    }
}

function Log {
    param([string]$msg)
    Write-Host $msg -ForegroundColor Cyan
    Add-Content -Path "race_log.txt" -Value $msg
}

# Clear log
Set-Content -Path "race_log.txt" -Value "Starting Test..."

Log "1. Registering Manufacturer..."
$mfgEmail = "mfg_race_$(Get-Random)@test.com"
$mfg = Invoke-Api -Method POST -Uri "/api/auth/register" -Body @{ username="MfgRace"; email=$mfgEmail; password="password"; role="manufacturer" }
Log "   Response: $($mfg | ConvertTo-Json -Depth 5)"
$mfgToken = $mfg.token
Log "   Manufacturer Registered: $($mfg.user.id)"

Log "2. Registering Supplier A..."
$supAEmail = "supA_race_$(Get-Random)@test.com"
$supA = Invoke-Api -Method POST -Uri "/api/auth/register" -Body @{ username="SupA"; email=$supAEmail; password="password"; role="supplier" }
$supAToken = $supA.token
Log "   Supplier A Registered: $($supA.user.id)"

Log "3. Registering Supplier B..."
$supBEmail = "supB_race_$(Get-Random)@test.com"
$supB = Invoke-Api -Method POST -Uri "/api/auth/register" -Body @{ username="SupB"; email=$supBEmail; password="password"; role="supplier" }
$supBToken = $supB.token
Log "   Supplier B Registered: $($supB.user.id)"

Log "4. Creating Product and Order..."
$product = Invoke-Api -Method POST -Uri "/api/products" -Body @{ name="RaceItem"; description="Test"; price=100; category="Test"; image="test.jpg"; specifications={} } -Token $mfgToken
$order = Invoke-Api -Method POST -Uri "/api/orders" -Body @{ productId=$product.id; quantity=10; shippingAddress="Test Addr"; location="Test Loc" } -Token $mfgToken # Self-order for simplicity
Log "   Order Created: $($order.orderId)"

Log "5. Manufacturer adding Supplier Contacts..."
$contactA = Invoke-Api -Method POST -Uri "/api/manufacturer/suppliers" -Body @{ name="SupA Contact"; email=$supAEmail } -Token $mfgToken
$contactB = Invoke-Api -Method POST -Uri "/api/manufacturer/suppliers" -Body @{ name="SupB Contact"; email=$supBEmail } -Token $mfgToken
Log "   Contacts Added: A=$($contactA.id), B=$($contactB.id)"

Log "6. Assigning Order to BOTH Suppliers..."
$assign = Invoke-Api -Method POST -Uri "/api/manufacturer/send-order" -Body @{ orderId=$order.orderId; supplierIds=@($contactA.id, $contactB.id) } -Token $mfgToken
Log "   Assignment Response: $($assign | ConvertTo-Json -Depth 2)"

Log "7. Verifying Pending Orders for Both..."
$pendingA = Invoke-Api -Method GET -Uri "/api/supplier/pending-orders" -Token $supAToken
$pendingB = Invoke-Api -Method GET -Uri "/api/supplier/pending-orders" -Token $supBToken
Log "   Supplier A Pending Count: $($pendingA.Count)"
Log "   Supplier B Pending Count: $($pendingB.Count)"

if ($pendingA.Count -eq 1 -and $pendingB.Count -eq 1) {
    Log "   ✅ Both suppliers have the order pending."
} else {
    Log "   ❌ Setup failed. Pending counts incorrect."
    exit
}

Log "8. Supplier A ACCEPTS the order..."
$accept = Invoke-Api -Method POST -Uri "/api/supplier/accept-order/$($order.orderId)" -Body @{ manufacturerId=$mfg.user.id } -Token $supAToken
Log "   Accept Response: $($accept | ConvertTo-Json)"

Log "9. Verifying Result..."
$pendingA_Final = Invoke-Api -Method GET -Uri "/api/supplier/pending-orders" -Token $supAToken
$assignedA_Final = Invoke-Api -Method GET -Uri "/api/supplier/assigned-orders" -Token $supAToken
$pendingB_Final = Invoke-Api -Method GET -Uri "/api/supplier/pending-orders" -Token $supBToken

Log "   Supplier A Pending: $($pendingA_Final.Count)"
Log "   Supplier A Assigned: $($assignedA_Final.Count)"
Log "   Supplier B Pending: $($pendingB_Final.Count)"

if ($assignedA_Final.Count -eq 1 -and $pendingB_Final.Count -eq 0) {
    Log "   ✅ SUCCESS: Supplier A has the order, Supplier B lost it."
    Set-Content -Path "race_result.txt" -Value "SUCCESS"
} else {
    Log "   ❌ FAILURE: Logic incorrect."
    Set-Content -Path "race_result.txt" -Value "FAILURE"
}
