# install.ps1 - Installs the Synth language extension globally in Cursor and VS Code.
# Run from the vscode-extension directory: .\install.ps1
#
# Installs a grammar-only VSIX (no activation race) to your user profile:
#   %USERPROFILE%\.cursor\extensions\
#   %USERPROFILE%\.vscode\extensions\
# Also caches the VSIX at %USERPROFILE%\.synth\synth-language.vsix for reinstalls.

$version = "1.0.9"
$src = $PSScriptRoot
$vsixName = "synth-language-$version.vsix"
$vsix = Join-Path $src $vsixName
$cacheDir = Join-Path $env:USERPROFILE ".synth"
$cachedVsix = Join-Path $cacheDir "synth-language.vsix"

function Remove-StaleExtensionRegistryEntries {
  param([string]$RegistryPath)

  if (-not (Test-Path $RegistryPath)) { return }

  try {
    $raw = Get-Content $RegistryPath -Raw | ConvertFrom-Json
    $extensionsRoot = Split-Path $RegistryPath -Parent
    $kept = @()

    foreach ($entry in $raw) {
      $rel = $entry.relativeLocation
      if (-not $rel) { $kept += $entry; continue }
      $folder = Join-Path $extensionsRoot $rel
      if (Test-Path $folder) {
        $kept += $entry
      } else {
        Write-Host "  Pruned missing extension: $rel" -ForegroundColor DarkGray
      }
    }

    if ($kept.Count -ne $raw.Count) {
      $kept | ConvertTo-Json -Depth 10 | Set-Content $RegistryPath -Encoding UTF8
    }
  } catch {
    Write-Host "  Warning: could not prune $RegistryPath ($($_.Exception.Message))" -ForegroundColor Yellow
  }
}

function Pin-Extension {
  param(
    [string]$RegistryPath,
    [string]$ExtensionId
  )

  if (-not (Test-Path $RegistryPath)) { return }

  try {
    $raw = Get-Content $RegistryPath -Raw | ConvertFrom-Json
    $changed = $false
    foreach ($entry in $raw) {
      if ($entry.identifier.id -eq $ExtensionId) {
        if (-not $entry.metadata) { $entry | Add-Member -NotePropertyName metadata -NotePropertyValue @{} }
        if (-not $entry.metadata.pinned) {
          $entry.metadata.pinned = $true
          $changed = $true
        }
      }
    }
    if ($changed) {
      $raw | ConvertTo-Json -Depth 10 | Set-Content $RegistryPath -Encoding UTF8
      Write-Host "  Pinned $ExtensionId in $(Split-Path $RegistryPath -Parent)" -ForegroundColor DarkGray
    }
  } catch {
    Write-Host "  Warning: could not pin $ExtensionId ($($_.Exception.Message))" -ForegroundColor Yellow
  }
}

function Install-FromRegistry {
  param(
    [string]$Cli,
    [string]$ExtensionId
  )

  if (-not (Get-Command $Cli -ErrorAction SilentlyContinue)) {
    Write-Host "  Skipped $Cli (not on PATH)" -ForegroundColor DarkGray
    return $false
  }

  Write-Host "  Trying marketplace install via $Cli..." -ForegroundColor Cyan
  & $Cli --install-extension $ExtensionId --force 2>&1 | Out-Host
  return $LASTEXITCODE -eq 0
}

function Install-Vsix {
  param(
    [string]$Cli,
    [string]$PackagePath
  )

  if (-not (Get-Command $Cli -ErrorAction SilentlyContinue)) {
    Write-Host "  Skipped $Cli (not on PATH)" -ForegroundColor DarkGray
    return $false
  }

  & $Cli --install-extension $PackagePath --force 2>&1 | Out-Host
  return $true
}

Write-Host "Installing Synth language extension v$version..." -ForegroundColor Cyan

$legacyIds = @(
  "synth-lang.synth-language-0.1.0",
  "synth-lang.synth-language-1.0.0",
  "synth-lang.synth-language-1.0.1",
  "synth-lang.synth-language-1.0.3",
  "synth-lang.synth-language-1.0.4",
  "synth-lang.synth-language-1.0.5",
  "synth-lang.synth-language-1.0.6",
  "synth-lang.synth-language-1.0.7",
  "axon-lang.axon-language-0.1.0"
)

foreach ($root in @(
  (Join-Path $env:USERPROFILE ".cursor\extensions"),
  (Join-Path $env:USERPROFILE ".vscode\extensions")
)) {
  foreach ($legacy in $legacyIds) {
    $legacyPath = Join-Path $root $legacy
    if (Test-Path $legacyPath) {
      Remove-Item -Recurse -Force $legacyPath
      Write-Host "  Removed legacy: $legacy" -ForegroundColor DarkGray
    }
  }
  Remove-StaleExtensionRegistryEntries (Join-Path $root "extensions.json")
}

Write-Host "  Packaging VSIX..." -ForegroundColor Cyan
Push-Location $src
try {
  npx --yes @vscode/vsce package --no-dependencies | Out-Host
} finally {
  Pop-Location
}

if (-not (Test-Path $vsix)) {
  Write-Error "VSIX not found: $vsix"
  exit 1
}

New-Item -ItemType Directory -Force $cacheDir | Out-Null
Copy-Item $vsix $cachedVsix -Force
Write-Host "  Cached VSIX: $cachedVsix" -ForegroundColor DarkGray

Write-Host "  Installing globally via editor CLIs..." -ForegroundColor Cyan
$extensionId = "synth-lang.synth-language"
$fromMarketCursor = Install-FromRegistry -Cli "cursor" -ExtensionId $extensionId
$fromMarketCode = Install-FromRegistry -Cli "code" -ExtensionId $extensionId

if (-not $fromMarketCursor -and -not $fromMarketCode) {
  Write-Host "  Marketplace install unavailable - using local VSIX" -ForegroundColor Yellow
  $null = Install-Vsix -Cli "cursor" -PackagePath $cachedVsix
  $null = Install-Vsix -Cli "code" -PackagePath $cachedVsix
}

foreach ($root in @(
  (Join-Path $env:USERPROFILE ".cursor\extensions"),
  (Join-Path $env:USERPROFILE ".vscode\extensions")
)) {
  Pin-Extension -RegistryPath (Join-Path $root "extensions.json") -ExtensionId "synth-lang.synth-language"
}

Write-Host ""
Write-Host "Done! Synth is installed globally for your user account." -ForegroundColor Green
if ($fromMarketCursor -or (Get-Command cursor -ErrorAction SilentlyContinue)) {
  Write-Host "  Cursor: $extensionId@$version" -ForegroundColor Cyan
}
if ($fromMarketCode -or (Get-Command code -ErrorAction SilentlyContinue)) {
  Write-Host "  VS Code: $extensionId@$version" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "Reload Cursor once (Developer: Reload Window). Highlighting should persist across restarts." -ForegroundColor Green
Write-Host "Reinstall anytime: $cachedVsix" -ForegroundColor DarkGray
