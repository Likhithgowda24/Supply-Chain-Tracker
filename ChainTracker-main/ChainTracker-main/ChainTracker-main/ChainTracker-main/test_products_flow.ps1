
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$manufacturerName = "manuf$timestamp"
$email = "manuf$timestamp@example.com"
$password = "password123"

Write-Host "1. Registering Manufacturer..."
$body = @{
    username = $manufacturerName
    email = $email
    password = $password
    role = "manufacturer"
    securityQuestion = "q"
    securityAnswer = "a"
} | ConvertTo-Json

try {
    $regResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/signup" -Method Post -Body $body -ContentType "application/json"
    $token = $regResponse.accessToken
    Write-Host "Manufacturer Registered. Token: $($token.Substring(0, 10))..."
} catch {
    Write-Host "Registration Failed: $_"
    exit 1
}

Write-Host "2. Creating Product..."
$productBody = @{
    productId = "PROD-$timestamp"
    name = "Test Product $timestamp"
    description = "A test product"
    price = 100
    stock = 50
    category = "Electronics"
} | ConvertTo-Json

try {
    $prodResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/products" -Method Post -Body $productBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
    Write-Host "Product Created: $($prodResponse.name) (ID: $($prodResponse.id))"
} catch {
    Write-Host "Product Creation Failed: $_"
    exit 1
}

Write-Host "3. Listing Products..."
try {
    $listResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/products" -Method Get
    $found = $listResponse | Where-Object { $_.productId -eq "PROD-$timestamp" }
    if ($found) {
        Write-Host "Product Found in List: $($found.name)"
    } else {
        Write-Host "Product NOT Found in List"
        exit 1
    }
} catch {
    Write-Host "List Products Failed: $_"
    exit 1
}

Write-Host "Product Flow Verified!"
