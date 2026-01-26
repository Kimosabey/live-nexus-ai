# LiveNexus AI - Local Development
# Run this script to start the AI Worker

Write-Host "🚀 Starting LiveNexus AI Worker..." -ForegroundColor Cyan

# Activate virtual environment
Write-Host "`n📦 Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Navigate to worker directory
Set-Location ai-worker

# Install/update dependencies
Write-Host "`n📥 Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Run the worker
Write-Host "`n🤖 Starting AI Worker..." -ForegroundColor Green
python main.py
