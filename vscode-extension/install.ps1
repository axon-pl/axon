# install.ps1 — Installs the Synth language extension directly into Cursor's extensions folder.
# Run from the vscode-extension directory: .\install.ps1

$extensionId = "synth-lang.synth-language-0.1.0"
$src = $PSScriptRoot
$dest = Join-Path $env:USERPROFILE ".cursor\extensions\$extensionId"

Write-Host "Installing Synth language extension..." -ForegroundColor Cyan

# Remove old version if present
if (Test-Path $dest) {
  Remove-Item -Recurse -Force $dest
  Write-Host "  Removed old version." -ForegroundColor DarkGray
}

# Remove legacy axon extension if present
$oldDest = Join-Path $env:USERPROFILE ".cursor\extensions\axon-lang.axon-language-0.1.0"
if (Test-Path $oldDest) {
  Remove-Item -Recurse -Force $oldDest
  Write-Host "  Removed legacy axon extension." -ForegroundColor DarkGray
}

# Copy extension folder (exclude .vsix and install script itself)
New-Item -ItemType Directory -Force $dest | Out-Null
Copy-Item "$src\package.json" $dest
Copy-Item "$src\language-configuration.json" $dest
Copy-Item "$src\icon.svg" $dest
Copy-Item "$src\README.md" $dest -ErrorAction SilentlyContinue
Copy-Item "$src\LICENSE" $dest -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force "$dest\syntaxes" | Out-Null
Copy-Item "$src\syntaxes\*" "$dest\syntaxes\"

Write-Host "  Installed to: $dest" -ForegroundColor Green
Write-Host ""
Write-Host "Done! Restart Cursor (or run 'Developer: Reload Window')" -ForegroundColor Green
Write-Host "Open any .syn file to see syntax highlighting." -ForegroundColor Cyan
