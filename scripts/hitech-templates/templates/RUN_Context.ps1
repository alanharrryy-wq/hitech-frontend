[CmdletBinding()]
param()

$ErrorActionPreference="Stop"

Write-Progress -Activity "HITECH" -Status "0/3 Detectando repo root..." -PercentComplete 5

$repoRoot = (git -C $PSScriptRoot rev-parse --show-toplevel).Trim()

Write-Progress -Activity "HITECH" -Status "1/3 Aplicando JS Templates (patcher)..." -PercentComplete 35
$patcher = Join-Path $repoRoot "scripts\hitech-templates\patcher.mjs"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "No encuentro 'node' en PATH." }
if (-not (Test-Path -LiteralPath $patcher)) { throw "No existe patcher.mjs: $patcher" }

Push-Location $repoRoot
try { node .\scripts\hitech-templates\patcher.mjs }
finally { Pop-Location }

Write-Progress -Activity "HITECH" -Status "2/3 Generando Chat Context (-Zip)..." -PercentComplete 75
$ctx = Join-Path $repoRoot "docs\Context_ChatGPT\Get-HitechChatContext.ps1"
if (-not (Test-Path -LiteralPath $ctx)) { throw "No existe: $ctx" }

pwsh -NoProfile -ExecutionPolicy Bypass -File $ctx -Zip

Write-Progress -Activity "HITECH" -Completed -Status "Listo"
Write-Host ""
Write-Host "✅ Listo. Runs en:" -ForegroundColor Green
Write-Host (Join-Path $repoRoot "docs\Context_ChatGPT\runs") -ForegroundColor Cyan
