# install.ps1 — Installs the Axon language extension directly into Cursor's extensions folder.
# Run from the vscode-extension directory: .\install.ps1

$extensionId = "axon-lang.axon-language-0.1.0"
$src = $PSScriptRoot
$dest = Join-Path $env:USERPROFILE ".cursor\extensions\$extensionId"

Write-Host "Installing Axon language extension..." -ForegroundColor Cyan

# Remove old version if present
if (Test-Path $dest) {
  Remove-Item -Recurse -Force $dest
  Write-Host "  Removed old version." -ForegroundColor DarkGray
}

# Copy extension folder
Copy-Item -Recurse -Force $src $dest
Write-Host "  Copied to: $dest" -ForegroundColor Green

Write-Host ""
Write-Host "Done! Restart Cursor (or run 'Developer: Reload Window')" -ForegroundColor Green
Write-Host "Open any .axn file to see syntax highlighting." -ForegroundColor Cyan
