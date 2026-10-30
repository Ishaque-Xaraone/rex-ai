# Install Monorepo Dependencies
Write-Host "Installing root npm dependencies with workspaces..." -ForegroundColor Cyan
npm install

if (Test-Path "AI-Service") {
    Write-Host "Setting up Python virtual environment for AI-Service..." -ForegroundColor Cyan
    Push-Location "AI-Service"
    if (-not (Test-Path ".venv")) {
        python -m venv .venv
    }
    & ".\.venv\Scripts\python.exe" -m pip install --upgrade pip
    & ".\.venv\Scripts\pip.exe" install -r requirements.txt
    Pop-Location
}

Write-Host "Setup completed successfully." -ForegroundColor Green
