[CmdletBinding()]
param(
  [switch]$Zip
)

$ErrorActionPreference = "Stop"

function Get-GitRoot {
  try {
    $root = git rev-parse --show-toplevel 2>$null
    if ($LASTEXITCODE -eq 0 -and $root) { return $root.Trim() }
  } catch {}
  throw "No se pudo detectar el root del repo (git)."
}

function Should-ExcludePath([string]$fullPath, [string]$rootPath) {
  $rel = $fullPath.Substring($rootPath.Length).TrimStart('\','/')
  $top = ($rel -split '[\\/]+')[0].ToLowerInvariant()

  $excludedTop = @(
    ".git","node_modules","dist","build",".next",".out",".cache",
    "coverage",".turbo",".vite",".pnpm-store"
  )

  if ($excludedTop -contains $top) { return $true }

  $ext = [IO.Path]::GetExtension($fullPath).ToLowerInvariant()
  $excludedExt = @(".png",".jpg",".jpeg",".gif",".webp",".ico",".mp4",".mov",".zip",".7z",".rar",".pdf",".exe",".dll",".bin")
  if ($excludedExt -contains $ext) { return $true }

  return $false
}

# ----------------- ROOT -----------------
$repoRoot = Get-GitRoot

# ----------------- OUTPUT -----------------
$baseOut = Join-Path $repoRoot "docs\Context_ChatGPT\runs"
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$outDir = Join-Path $baseOut $ts
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$reportPath = Join-Path $outDir "CHAT_CONTEXT_$ts.md"
$treePath   = Join-Path $outDir "TREE_$ts.txt"

# ----------------- TREE -----------------
$files = Get-ChildItem $repoRoot -Recurse -File -Force |
  Where-Object { -not (Should-ExcludePath $_.FullName $repoRoot) }

$tree = $files |
  ForEach-Object { $_.FullName.Substring($repoRoot.Length).TrimStart('\','/') } |
  Sort-Object

$tree | Set-Content -LiteralPath $treePath -Encoding UTF8

# ----------------- FILE SELECTION -----------------
$mustHave = @(
  "package.json",
  "vite.config.ts",
  "vite.config.js",
  "tsconfig.json",
  "index.html",
  "public\modules.config.json",
  "src\modules.registry.ts",
  "src\pages\WebModulePage.tsx",
  "src\pages\ModulesDashboard.tsx",
  "src\main.tsx",
  "src\App.tsx"
)

$keywords = @(
  "HashRouter","import.meta.env.BASE_URL","modules.config.json",
  "demoUrl","renderMode","iframe","WebModulePage"
)

$selected = New-Object System.Collections.Generic.List[string]

foreach ($rel in $mustHave) {
  $p = Join-Path $repoRoot $rel
  if (Test-Path $p) { $selected.Add($p) }
}

foreach ($f in $files) {
  try {
    $txt = Get-Content $f.FullName -Raw -ErrorAction Stop
    foreach ($k in $keywords) {
      if ($txt -match [regex]::Escape($k)) {
        $selected.Add($f.FullName)
        break
      }
    }
  } catch {}
}

$selected = $selected | Sort-Object -Unique

# ----------------- REPORT -----------------
$sb = New-Object System.Text.StringBuilder
$sb.AppendLine("# HITECH Frontend — Chat Context") | Out-Null
$sb.AppendLine("Generated: $(Get-Date)") | Out-Null
$sb.AppendLine("Repo root: $repoRoot") | Out-Null
$sb.AppendLine("") | Out-Null

$sb.AppendLine("## TREE") | Out-Null
$sb.AppendLine('`') | Out-Null
$sb.AppendLine((Get-Content $treePath -Raw)) | Out-Null
$sb.AppendLine('`') | Out-Null

foreach ($f in $selected) {
  $rel = $f.Substring($repoRoot.Length).TrimStart('\','/')
  $sb.AppendLine("") | Out-Null
  $sb.AppendLine("## FILE: $rel") | Out-Null
  $sb.AppendLine('`') | Out-Null
  try {
    $sb.AppendLine((Get-Content $f -Raw)) | Out-Null
  } catch {
    $sb.AppendLine("[ERROR leyendo archivo]") | Out-Null
  }
  $sb.AppendLine('`') | Out-Null
}

$sb.ToString() | Set-Content -LiteralPath $reportPath -Encoding UTF8

# ----------------- ZIP -----------------
if ($Zip) {
  $zipPath = Join-Path $outDir "CHAT_CONTEXT_$ts.zip"
  Compress-Archive -Path $outDir\* -DestinationPath $zipPath -Force
}

Write-Host ""
Write-Host "✅ Contexto generado en:"
Write-Host "   $outDir"
Write-Host ""
Write-Host "➡️  En un chat nuevo, pégame el .md o el contenido clave del ZIP."

