#!/usr/bin/env bash
set -e

echo "Installing root npm dependencies with workspaces..."
npm install

if [ -d "AI-Service" ]; then
    echo "Setting up Python virtual environment for AI-Service..."
    cd AI-Service
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
    fi
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    cd ..
fi

echo "Setup completed successfully."
