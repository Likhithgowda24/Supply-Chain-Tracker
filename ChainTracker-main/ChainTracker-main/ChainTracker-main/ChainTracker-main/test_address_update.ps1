
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

Write-Host "Testing Address Update Functionality..." -ForegroundColor Cyan

# 1. Register a new user
$User = "addr_test_" + (Get-Random)
$Email = "$User@test.com"
Write-Host "Registering User: $User"
$regBody = @{
    username = $User
    password = "password123"
    email = $Email
    role = "customer"
    securityQuestion = "q"
    securityAnswer = "a"
}
$reg = Test-Endpoint -Method "POST" -Url "$BaseUrl/api/auth/signup" -Body $regBody

if (-not $reg) { Write-Error "Failed to register user" }
$Token = $reg.accessToken
Write-Host "User Registered. ID: $($reg.user.id)" -ForegroundColor Green

# 2. Create/Update Address
Write-Host "Updating Address..."
$addrBody = @{
    street = "123 Test St"
    city = "Test City"
    state = "TS"
    zipCode = "12345"
    country = "Testland"
    isDefault = $true
}
$addr = Test-Endpoint -Method "POST" -Url "$BaseUrl/api/address" -Body $addrBody -Token $Token

if (-not $addr) { Write-Error "Failed to update address" }
Write-Host "Address Updated. ID: $($addr.id)" -ForegroundColor Green

# 3. Verify Address Persistence
Write-Host "Verifying Address Persistence..."
$addresses = Test-Endpoint -Method "GET" -Url "$BaseUrl/api/address" -Token $Token

if (-not $addresses) { Write-Error "Failed to fetch addresses" }

$found = $false
if ($addresses -is [System.Array]) {
    foreach ($a in $addresses) {
        if ($a.street -eq "123 Test St" -and $a.city -eq "Test City") {
            $found = $true
            break
        }
    }
} else {
    if ($addresses.street -eq "123 Test St" -and $addresses.city -eq "Test City") {
        $found = $true
    }
}

if ($found) {
    Write-Host "Address Verified Successfully!" -ForegroundColor Green
} else {
    Write-Error "Address verification failed. Fetched: $($addresses | ConvertTo-Json -Depth 2)"
}
