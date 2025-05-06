# Enforce TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Model and test prompt
$modelName  = "gemini-1.5-flash"
$testPrompt = "Write a short, one-sentence greeting."

# Show what you're about to call
Write-Host "Using model:" $modelName
$uri = "https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent"
Write-Host "Constructed URI:" $uri

# Prompt for API Key
Write-Host "`nPlease paste your Google Gemini API key:" -ForegroundColor Yellow
$apiKey = Read-Host -Prompt "API Key"
if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Error "API Key cannot be empty."
    exit 1
}

# Build request body
$requestBody = @{
    contents = @(
        @{
            parts = @(
                @{ text = $testPrompt }
            )
        }
    )
} | ConvertTo-Json -Depth 5

Write-Host "`nSending request to generate content..." -ForegroundColor Cyan

# Header-based key for reliability
$headers = @{
    "Content-Type"   = "application/json"
    "x-goog-api-key" = $apiKey
}

try {
    $response = Invoke-RestMethod `
        -Uri      $uri `
        -Method   Post `
        -Headers  $headers `
        -Body     $requestBody `
        -Verbose  `
        -ErrorAction Stop

    # Debug dump of what you actually got back
    Write-Host "`nDEBUG: Full JSON response:" -ForegroundColor Yellow
    ($response | ConvertTo-Json -Depth 5) | Write-Host

    # Safe extraction—only index if candidates array exists :contentReference[oaicite:0]{index=0}
    $generatedText = $null
    if ($response.candidates `
        -and $response.candidates.Count -gt 0 `
        -and $response.candidates[0].content `
        -and $response.candidates[0].content.parts.Count -gt 0) {

        $generatedText = $response.candidates[0].content.parts[0].text
    }

    if ($generatedText) {
        Write-Host "`n--- Gemini API Response ---" -ForegroundColor Green
        Write-Host $generatedText
        Write-Host "---------------------------" -ForegroundColor Green
        Write-Host "`nSUCCESS: API key appears valid for generation." -ForegroundColor Green
    } else {
        Write-Warning "`nWARNING: No generated text found in response."
        Write-Host "Inspect the JSON above for the correct path."
    }

} catch [System.Net.WebException] {
    $err = $_.Exception
    Write-Host "`nERROR: $($err.Message)" -ForegroundColor Red

    if ($err.Response) {
        $status = $err.Response.StatusCode.value__
        $body   = (New-Object IO.StreamReader($err.Response.GetResponseStream())).ReadToEnd()
        Write-Host "Status Code: $status" -ForegroundColor Red
        Write-Host "Response Body:`n$body" -ForegroundColor Red

        if ($body -match '"reason":\s*"API_KEY_INVALID"') {
            Write-Host "`nFAILURE: The API key is invalid according to Google." -ForegroundColor Red
        } else {
            Write-Host "`nFAILURE: Check the error details above." -ForegroundColor Red
        }
    } else {
        Write-Host "`nFAILURE: No response received. Check connectivity/proxy." -ForegroundColor Red
    }
    exit 1

} catch {
    Write-Host "`nUNEXPECTED ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
