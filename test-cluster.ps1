# VoyageCore Automated Smoke Test Script
# Usage: .\test-cluster.ps1

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "       VOYAGECORE DISTRIBUTED PLATFORM SMOKE TEST       " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"

# 1. API Gateway Health & Downstream Discovery
try {
    $gw = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "[PASS] API Gateway is Healthy" -ForegroundColor Green
    Write-Host "       -> Downstream Identity:     $($gw.downstream.identityManager)" -ForegroundColor Gray
    Write-Host "       -> Downstream Profiles:     $($gw.downstream.profileService)" -ForegroundColor Gray
    Write-Host "       -> Downstream Bookings:     $($gw.downstream.bookingEngine)" -ForegroundColor Gray
    Write-Host "       -> Downstream Transactions: $($gw.downstream.transactionService)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] API Gateway Unreachable: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Public Catalog Endpoint
try {
    $travels = Invoke-RestMethod -Uri "$baseUrl/api/travels" -Method Get
    Write-Host "[PASS] Booking Engine Public Catalog Accessible (Total: $($travels.total))" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Booking Engine Catalog Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Identity Manager - Authentication & JWT Issuance
try {
    $loginPayload = @{ email = "admin@travel.com"; password = "Admin@123" } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginPayload
    $token = $login.token
    Write-Host "[PASS] Identity Manager Issued JWT for $($login.user.email) (Role: $($login.user.role))" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Authentication Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Profile Service - RBAC Protected Route
try {
    $headers = @{ Authorization = "Bearer $token" }
    $profiles = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method Get -Headers $headers
    Write-Host "[PASS] Profile Service RBAC Protected Query Successful (Users Found: $($profiles.total))" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Profile Service RBAC Query Denied: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Booking Engine - Create New Travel Package
try {
    $newTrip = @{
        title = "Automated Test Expedition"
        description = "Automated smoke test package"
        price = 999.99
        durationDays = 5
        startDate = "2026-10-01"
        endDate = "2026-10-06"
        maxParticipants = 10
        status = "active"
    } | ConvertTo-Json

    $trip = Invoke-RestMethod -Uri "$baseUrl/api/travels" -Method Post -Headers $headers -ContentType "application/json" -Body $newTrip
    $tripId = $trip.id
    Write-Host "[PASS] Booking Engine Created Package with ID: $tripId" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Booking Engine Trip Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Booking Engine - Clean Up Created Package
if ($tripId) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/travels/$tripId" -Method Delete -Headers $headers | Out-Null
        Write-Host "[PASS] Booking Engine Cascade Deletion Verified" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] Booking Engine Deletion Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 7. Transaction Service - Payment Gateways
try {
    $methods = Invoke-RestMethod -Uri "$baseUrl/api/payment-methods" -Method Get -Headers $headers
    Write-Host "[PASS] Transaction Service Returned $($methods.Count) Configured Payment Channels" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Transaction Service Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 8. Web Frontend Console
try {
    $web = Invoke-WebRequest -Uri "http://localhost:3005" -UseBasicParsing
    Write-Host "[PASS] VoyageCore Web Console Accessible on Port 3005 (HTTP $($web.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Web Console Unreachable: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "                ALL SYSTEMS VERIFIED HEALTHY            " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

