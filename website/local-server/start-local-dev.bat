@echo off
echo 🚀 Starting Meals.Stellation.One Local Development Server...
echo.

cd /d "k:\Dev\meals.stellation.one\website\local-server"

if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
    echo.
)

echo 🌐 Starting server on http://localhost:3001
echo 💡 Press Ctrl+C to stop the server
echo.

npm start
