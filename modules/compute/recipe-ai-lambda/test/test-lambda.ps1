# Define paths
$testDir = $PSScriptRoot
$testEventPath = Join-Path $testDir "test-event.json"
$responsePath = Join-Path $testDir "response.json"

# Create test event file if it doesn't exist
if (-not (Test-Path $testEventPath)) {
    @{
        body = @{
            text = @"
Grilled Chicken Salad

Ingredients:
- 2 chicken breasts
- Mixed salad greens
- Cherry tomatoes
- Cucumber
- Olive oil

Instructions:
1. Season chicken breasts
2. Grill until cooked through
3. Slice chicken
4. Combine with vegetables
5. Drizzle with olive oil
"@
        } | ConvertTo-Json -Depth 10
    } | ConvertTo-Json -Compress | Set-Content $testEventPath
}

Write-Host "`nInvoking Lambda function...`n" -ForegroundColor Yellow

# Invoke Lambda
aws lambda invoke `
    --function-name recipe-ai-function `
    --payload (Get-Content -Path $testEventPath -Raw) `
    --cli-binary-format raw-in-base64-out `
    --log-type Tail `
    $responsePath

# Show response
Write-Host "`nLambda Response:`n" -ForegroundColor Yellow
if (Test-Path $responsePath) {
    Get-Content $responsePath | ConvertFrom-Json | ConvertTo-Json -Depth 10
} else {
    Write-Host "No response file generated" -ForegroundColor Red
}

# Show recent logs
Write-Host "`nRecent CloudWatch Logs:`n" -ForegroundColor Yellow
aws logs tail /aws/lambda/recipe-ai-function --since 30s --format short