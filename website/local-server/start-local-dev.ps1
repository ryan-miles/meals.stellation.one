Write-Host "🚀 Starting Meals.Stellation.One Local Development Server..." -ForegroundColor Green
Write-Host ""

Set-Location "k:\Dev\meals.stellation.one\website\local-server"

if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

Write-Host "🌐 Starting server on http://localhost:3001" -ForegroundColor Cyan
Write-Host "💡 Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm start
