# Define paths
$moduleRoot = $PSScriptRoot
$functionDir = Join-Path $moduleRoot "function"
$terraformRoot = (Get-Item $moduleRoot).Parent.Parent.Parent.FullName

# Function to update OpenAI API key in Secrets Manager
function Update-OpenAISecret {
    Write-Host "`nUpdating OpenAI API key in Secrets Manager...`n" -ForegroundColor Yellow
    
    $secretValue = @{
        key = $env:OPENAI_API_KEY
    } | ConvertTo-Json

    aws secretsmanager update-secret `
        --secret-id "/meals-stellation/openai-api-key" `
        --secret-string $secretValue
}

# Install dependencies
Write-Host "`nInstalling production dependencies...`n" -ForegroundColor Yellow
Push-Location $functionDir
npm install --production
Pop-Location

# Update secret if OPENAI_API_KEY is set
if ($env:OPENAI_API_KEY) {
    Update-OpenAISecret
}

# Apply Terraform changes
Write-Host "`nApplying Terraform changes...`n" -ForegroundColor Yellow
Push-Location $terraformRoot
terraform plan -out=tfplan
terraform apply tfplan
Pop-Location