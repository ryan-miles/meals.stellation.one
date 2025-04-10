# Get module root directory
$moduleRoot = $PSScriptRoot
$terraformRoot = (Get-Item $moduleRoot).Parent.Parent.Parent.FullName

# Show deployment start
Write-Host "`nDeploying website changes...`n" -ForegroundColor Yellow

# Apply Terraform changes
Push-Location $terraformRoot
terraform apply -target="module.website" -auto-approve
Pop-Location

# Invalidate CloudFront cache
Write-Host "`nInvalidating CloudFront cache...`n" -ForegroundColor Yellow
$distributionId = "E1N2YV51Q8UVH"
aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*"

Write-Host "`nWebsite deployment complete!`n" -ForegroundColor Green
Write-Host "Changes should be visible at https://meals.stellation.one in a few minutes.`n"