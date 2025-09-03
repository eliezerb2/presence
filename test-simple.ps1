$ErrorActionPreference = "Stop"

Write-Host "Running End-to-End Tests..." -ForegroundColor Green

$API_BASE = "http://localhost:30081/api"

# Test API Health
Write-Host "Testing API Health..." -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "http://localhost:30081/" -Method GET
Write-Host "API Response: $($response.message)" -ForegroundColor Green

# Test Student Creation
Write-Host "Testing Student Creation..." -ForegroundColor Cyan
$studentData = @{
    student_number = "999"
    nickname = "testuser"
    first_name = "Test"
    last_name = "User"
    school_level = "high_school"
    activity_status = "active"
} | ConvertTo-Json

$newStudent = Invoke-RestMethod -Uri "$API_BASE/students/" -Method POST -Body $studentData -ContentType "application/json"
Write-Host "Created student ID: $($newStudent.id)" -ForegroundColor Green

# Test Search
Write-Host "Testing Search..." -ForegroundColor Cyan
$searchResults = Invoke-RestMethod -Uri "$API_BASE/kiosk/search/testuser" -Method GET
Write-Host "Found $($searchResults.Count) students" -ForegroundColor Green

# Test Check-in
Write-Host "Testing Check-in..." -ForegroundColor Cyan
$checkinResult = Invoke-RestMethod -Uri "$API_BASE/kiosk/checkin/$($newStudent.id)" -Method POST
Write-Host "Check-in successful" -ForegroundColor Green

# Test Daily Attendance
Write-Host "Testing Daily Attendance..." -ForegroundColor Cyan
$attendance = Invoke-RestMethod -Uri "$API_BASE/attendance/daily" -Method GET
Write-Host "Found $($attendance.Count) attendance records" -ForegroundColor Green

Write-Host "All tests passed!" -ForegroundColor Green