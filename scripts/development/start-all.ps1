# Launch all REX AI services
Write-Host "Starting REX AI Services in parallel..." -ForegroundColor Green

Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:frontend"

Write-Host "Services started:"
Write-Host "- Backend:  http://localhost:4000" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
