
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$username = "user$timestamp"
$email = "user$timestamp@example.com"
$password = "password123"

Write-Host "1. Registering user: $username"
$body = @{
    username = $username
    email = $email
    password = $password
    role = "customer"
    securityQuestion = "q"
    securityAnswer = "a"
} | ConvertTo-Json

try {
    $regResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/signup" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Registration Successful. User ID: $($regResponse.user.id)"
} catch {
    Write-Host "Registration Failed: $_"
    exit 1
}

Write-Host "2. Logging in..."
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "Login Successful. Access Token: $($loginResponse.accessToken.Substring(0, 10))..."
} catch {
    Write-Host "Login Failed: $_"
    exit 1
}

Write-Host "Auth Flow Verified!"
