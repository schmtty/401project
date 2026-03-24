# Keeper - Database Setup Script
# Run this after updating backend/.env with your PostgreSQL password
# Usage: .\setup-db.ps1
# Or with password: $env:PGPASSWORD='your_password'; .\setup-db.ps1

$ErrorActionPreference = "Stop"
Write-Host "Setting up Keeper database..." -ForegroundColor Cyan

# Create database
psql -U postgres -c "DROP DATABASE IF EXISTS ab2;"
psql -U postgres -c "CREATE DATABASE ab2;"

# Apply schema
psql -U postgres -d ab2 -f db/schema.sql

# Load seed data
psql -U postgres -d ab2 -f db/seed.sql

Write-Host "Database setup complete!" -ForegroundColor Green
