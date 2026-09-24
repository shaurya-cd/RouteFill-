# ==============================================================================
# RouteFill AI - End-to-End API Integration Verification Suite
# ==============================================================================

$BaseUrl = "http://localhost:5000/api"
$ErrorActionPreference = "Stop"

Write-Host "`n[1/8] Testing Authentication..." -ForegroundColor Cyan

# Fleet Owner Login
$ownerLoginBody = @{ email = "owner@fleet.in"; password = "password123" } | ConvertTo-Json
$ownerRes = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $ownerLoginBody -ContentType "application/json"
$ownerToken = $ownerRes.data.token
$ownerHeader = @{ Authorization = "Bearer $ownerToken" }
Write-Host "  -> Fleet Owner Logged In successfully. User ID: $($ownerRes.data.user.id)" -ForegroundColor Green

# Admin Login
$adminLoginBody = @{ email = "admin@routefill.ai"; password = "password123" } | ConvertTo-Json
$adminRes = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
$adminToken = $adminRes.data.token
$adminHeader = @{ Authorization = "Bearer $adminToken" }
Write-Host "  -> Admin Logged In successfully." -ForegroundColor Green

# Get Profile (/auth/me)
$meRes = Invoke-RestMethod -Uri "$BaseUrl/auth/me" -Method Get -Headers $ownerHeader
Write-Host "  -> Profile retrieved for: $($meRes.data.name)" -ForegroundColor Green

Write-Host "`n[2/8] Testing Truck APIs..." -ForegroundColor Cyan
$trucksRes = Invoke-RestMethod -Uri "$BaseUrl/trucks" -Method Get -Headers $ownerHeader
$truck1 = $trucksRes.data | Where-Object { $_.truck_number -eq "DL01AB1234" }
Write-Host "  -> Retrieved $($trucksRes.count) owner trucks. Selected truck: $($truck1.truck_number) (ID: $($truck1.id))" -ForegroundColor Green

# Create a new truck
$randomNum = Get-Random -Minimum 1000 -Maximum 9999
$newTruckBody = @{
    truck_number = "HR55AB$randomNum"
    truck_type_id = 1
    capacity_tons = 15.5
    current_location_id = 1
} | ConvertTo-Json
$createTruckRes = Invoke-RestMethod -Uri "$BaseUrl/trucks" -Method Post -Headers $ownerHeader -Body $newTruckBody -ContentType "application/json"
$createdTruckId = $createTruckRes.data.id
Write-Host "  -> Successfully created new truck: $($createTruckRes.data.truck_number) (ID: $createdTruckId)" -ForegroundColor Green

Write-Host "`n[3/8] Testing Load APIs & Nearby Geo-radius Search..." -ForegroundColor Cyan
$loadsRes = Invoke-RestMethod -Uri "$BaseUrl/loads" -Method Get
Write-Host "  -> Active marketplace loads count: $($loadsRes.count)" -ForegroundColor Green

# Nearby search around Mumbai coordinates (19.0760, 72.8777) with 300km radius
$nearbyRes = Invoke-RestMethod -Uri "$BaseUrl/loads/nearby?latitude=19.0760&longitude=72.8777&radius=300" -Method Get
Write-Host "  -> Nearby loads within 300km of Mumbai: $($nearbyRes.count)" -ForegroundColor Green

Write-Host "`n[4/8] Testing Line-Haul Trip Lifecycle & Completion Trigger..." -ForegroundColor Cyan
$tripsRes = Invoke-RestMethod -Uri "$BaseUrl/trips" -Method Get -Headers $ownerHeader
Write-Host "  -> Current trips retrieved: $($tripsRes.count)" -ForegroundColor Green

# Schedule a new trip
$tripBody = @{
    truck_id = $truck1.id
    origin_location_id = 1
    destination_location_id = 2
    scheduled_start_time = (Get-Date).ToString("o")
    estimated_completion_time = (Get-Date).AddHours(24).ToString("o")
} | ConvertTo-Json
$tripCreateRes = Invoke-RestMethod -Uri "$BaseUrl/trips" -Method Post -Headers $ownerHeader -Body $tripBody -ContentType "application/json"
$testTripId = $tripCreateRes.data.id
Write-Host "  -> Scheduled Trip ID: $testTripId" -ForegroundColor Green

# Complete the trip to trigger dead-mileage analysis
$tripUpdateBody = @{
    status = "COMPLETED"
    actual_completion_time = (Get-Date).ToString("o")
} | ConvertTo-Json
$tripCompleteRes = Invoke-RestMethod -Uri "$BaseUrl/trips/$testTripId" -Method Patch -Headers $ownerHeader -Body $tripUpdateBody -ContentType "application/json"
Write-Host "  -> Trip completed. Post-trip dead mileage risk: $($tripCompleteRes.data.dead_mileage_analysis.risk_level), Empty Km: $($tripCompleteRes.data.dead_mileage_analysis.predicted_empty_distance_km)" -ForegroundColor Green

Write-Host "`n[5/8] Testing Direct Dead Mileage AI Prediction API..." -ForegroundColor Cyan
$dmReq = @{
    truck_id = $truck1.id
} | ConvertTo-Json
$dmRes = Invoke-RestMethod -Uri "$BaseUrl/ai/dead-mileage/predict" -Method Post -Headers $ownerHeader -Body $dmReq -ContentType "application/json"
Write-Host "  -> Dead Mileage Probability: $($dmRes.data.dead_mileage_probability), Risk Level: $($dmRes.data.risk_level), Predicted Empty Dist: $($dmRes.data.predicted_empty_distance_km) km" -ForegroundColor Green

Write-Host "`n[6/8] Testing AI Recommendation Pipeline (/recommendations/generate/:truckId)..." -ForegroundColor Cyan
$recRes = Invoke-RestMethod -Uri "$BaseUrl/recommendations/generate/$($truck1.id)" -Method Post -Headers $ownerHeader
Write-Host "  -> Generated $($recRes.data.recommendations.Count) intelligent return-load recommendations for Truck $($truck1.id)" -ForegroundColor Green
$topRec = $recRes.data.recommendations[0]
Write-Host "     Rank 1 Load ID:        $($topRec.load_id)" -ForegroundColor Yellow
Write-Host "     Cargo:                 $($topRec.load.cargo_description) ($($topRec.load.weight_tons) Tons)" -ForegroundColor Yellow
Write-Host "     Corridor:              $($topRec.load.pickup_location) -> $($topRec.load.destination_location)" -ForegroundColor Yellow
Write-Host "     Acceptance Probability:$($topRec.acceptance_probability)" -ForegroundColor Yellow
Write-Host "     Success Probability:   $($topRec.success_probability)" -ForegroundColor Yellow
Write-Host "     Predicted Net Profit:  INR $($topRec.predicted_profit)" -ForegroundColor Yellow
Write-Host "     Final Decision Score:  $($topRec.final_score) / 100" -ForegroundColor Yellow
Write-Host "     Reason:                $($topRec.reason)" -ForegroundColor Yellow
Write-Host "     ML Model Version:      $($topRec.model_version)" -ForegroundColor Yellow

Write-Host "`n[7/8] Testing Real-World Feedback Loop (/recommendations/:id/outcome)..." -ForegroundColor Cyan
$outcomeBody = @{
    was_accepted = $true
    was_completed = $true
    actual_profit = 14200.0
    actual_fuel_cost = 6200.0
    actual_toll_cost = 1150.0
    actual_waiting_time_minutes = 95
    actual_distance_km = 490.0
    completion_delay_minutes = 20
} | ConvertTo-Json
$outcomeRes = Invoke-RestMethod -Uri "$BaseUrl/recommendations/$($topRec.id)/outcome" -Method Post -Headers $ownerHeader -Body $outcomeBody -ContentType "application/json"
Write-Host "  -> Feedback Recorded: $($outcomeRes.data.message)" -ForegroundColor Green
Write-Host "     Outcome ID: $($outcomeRes.data.outcome.id), Actual Profit: INR $($outcomeRes.data.outcome.actual_profit)" -ForegroundColor Green

Write-Host "`n[8/8] Testing Continuous Retraining & Analytics (Admin API)..." -ForegroundColor Cyan
$retrainRes = Invoke-RestMethod -Uri "$BaseUrl/admin/ml/retrain" -Method Post -Headers $adminHeader
Write-Host "  -> Continuous Retraining Succeeded!" -ForegroundColor Green
Write-Host "     New Model Version:   $($retrainRes.data.metrics.model_version)" -ForegroundColor Yellow
Write-Host "     Acceptance Accuracy: $($retrainRes.data.metrics.acceptance_accuracy)" -ForegroundColor Yellow
Write-Host "     Success Accuracy:    $($retrainRes.data.metrics.success_accuracy)" -ForegroundColor Yellow
Write-Host "     Profit MAE (INR):    $($retrainRes.data.metrics.profit_mae)" -ForegroundColor Yellow
Write-Host "     Profit R2 Score:     $($retrainRes.data.metrics.profit_r2)" -ForegroundColor Yellow

$analyticsRes = Invoke-RestMethod -Uri "$BaseUrl/admin/analytics" -Method Get -Headers $adminHeader
Write-Host "`n  -> Platform Analytics Summary:" -ForegroundColor Green
Write-Host "     Registered Users:    $($analyticsRes.data.overview.total_users)" -ForegroundColor White
Write-Host "     Total Trucks:        $($analyticsRes.data.overview.registered_trucks)" -ForegroundColor White
Write-Host "     Loads Evaluated:     $($analyticsRes.data.ai_impact.total_recommendations_evaluated)" -ForegroundColor White
Write-Host "     Total Profit Saved:  INR $($analyticsRes.data.ai_impact.total_profit_generated_inr)" -ForegroundColor White
Write-Host "     Deadhead Km Saved:   $($analyticsRes.data.ai_impact.estimated_empty_km_eliminated) km" -ForegroundColor White

Write-Host "`n>>> ALL 8 INTEGRATION PHASES VERIFIED SUCCESSFULLY! <<<`n" -ForegroundColor Green
