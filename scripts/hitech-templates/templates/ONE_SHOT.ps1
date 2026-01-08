#requires -Version 7.0
<#
ONE_SHOT.ps1
Goal:
- Un solo comando en terminal (VS Code)
- No asume carpeta actual (resuelve git repo root)
- No escribe JS/TSX desde PowerShell (usa Clipboard -> archivo temporal UTF8 -> Node oneshot.mjs)
- Crea patch primigenio JSON en scripts/hitech-templates/Patches
- Escribe template en scripts/hitech-templates/templates/<target>
- Ejecuta patcher como cirujano (con glossary)
- Abre el archivo target para revision

Modes:
- writeFromClipboard (default): sobreescribe target con el contenido completo del clipboard via template
- repair: aplica glossary al target (sin template)
- replaceExactFromClipboard: el clipboard debe contener JSON { find, replace, expect?, firstOnly?, applyGlossary? }
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Target,

  [Parameter(Mandatory = $false)]
  [ValidateSet("writeFromClipboard", "repair", "replaceExactFromClipboard")]
  [string]$Mode = "writeFromClipboard",

  [Parameter(Mandatory = $false)]
  [string]$Description = "One-shot patch",

  [Parameter(Mandatory = $false)]
  [string]$PatchId,

  [Parameter(Mandatory = $false)]
  [switch]$DryRun,

  [Parameter(Mandatory = $false)]
  [switch]$NoOpen
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Step([int]$p, [string]$s) {
  Write-Progress -Id 1 -Activity "HITECH ONE_SHOT" -Status $s -PercentComplete $p
}

function Get-RepoRoot {
  $r = (& git rev-parse --show-toplevel 2>$null)
  if (-not $r) { throw "No pude resolver repo root con git rev-parse --show-toplevel. Abre la terminal dentro del repo." }
  $r.Trim()
}

function Assert-Node {
  try { $null = (& node -v 2>$null) } catch { throw "No encuentro Node en PATH." }
}

function NowStamp {
  (Get-Date).ToString("yyyyMMdd_HHmmss")
}

Step 5 "Resolviendo repo root"
$repoRoot = Get-RepoRoot

$oneshotRel = "scripts/hitech-templates/oneshot.mjs"
$patcherRel = "scripts/hitech-templates/patcher.mjs"

$oneshotAbs = Join-Path $repoRoot ($oneshotRel -replace '/', '\')
$patcherAbs = Join-Path $repoRoot ($patcherRel -replace '/', '\')
$targetRel  = $Target.Replace('\','/').TrimStart('/')
$targetAbs  = Join-Path $repoRoot ($targetRel -replace '/', '\')

Step 12 "Validando Node y motor"
Assert-Node

if (-not (Test-Path -LiteralPath $patcherAbs)) { throw "No existe: $patcherAbs" }
if (-not (Test-Path -LiteralPath $oneshotAbs)) { throw "No existe: $oneshotAbs. Aplica el patch engine-v2 primero." }

$stamp = NowStamp
$tmpDir = Join-Path $env:TEMP "hitech_oneshot"
if (-not (Test-Path -LiteralPath $tmpDir)) { New-Item -ItemType Directory -Path $tmpDir | Out-Null }

Step 25 "Preparando insumos"
$tmpContent = Join-Path $tmpDir ("content_" + $stamp + ".txt")
$tmpSpec    = Join-Path $tmpDir ("spec_" + $stamp + ".json")

$nodeArgs = @(
  ".\scripts\hitech-templates\oneshot.mjs",
  "--target", $targetRel,
  "--desc", $Description
)

if ($PatchId) {
  $nodeArgs += @("--id", $PatchId)
}

if ($DryRun) {
  $nodeArgs += @("--dry-run")
}

if ($Mode -eq "writeFromClipboard") {
  $clip = Get-Clipboard -Raw
  if (-not $clip) { throw "Clipboard vacio. Copia el contenido completo del archivo (TS/TSX/PS1) y vuelve a correr." }

  Set-Content -LiteralPath $tmpContent -Value $clip -Encoding UTF8

  $nodeArgs += @("--mode", "write", "--content-file", $tmpContent, "--apply")
}

if ($Mode -eq "replaceExactFromClipboard") {
  $clip = Get-Clipboard -Raw
  if (-not $clip) { throw "Clipboard vacio. Copia un JSON con { find, replace, expect? } y vuelve a correr." }

  Set-Content -LiteralPath $tmpSpec -Value $clip -Encoding UTF8

  $nodeArgs += @("--mode", "replaceExact", "--spec-file", $tmpSpec, "--apply")
}

if ($Mode -eq "repair") {
  $nodeArgs += @("--mode", "repair", "--apply")
}

Step 55 "Ejecutando oneshot (crea patch primigenio + aplica patcher)"
Push-Location -LiteralPath $repoRoot
try {
  & node @nodeArgs
} finally {
  Pop-Location
}

Step 90 "Abriendo target para revision"
if (-not $NoOpen) {
  if (Test-Path -LiteralPath $targetAbs) {
    try { Start-Process "code" -ArgumentList @("-r", $targetAbs) | Out-Null } catch {}
    try { Start-Process explorer.exe (Split-Path -Parent $targetAbs) | Out-Null } catch {}
  }
}

Write-Progress -Id 1 -Activity "HITECH ONE_SHOT" -Completed
Write-Host ""
Write-Host "OK. Target listo: $targetRel" -ForegroundColor Green
Write-Host ""
