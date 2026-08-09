$ErrorActionPreference = 'Stop'

$backendRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $backendRoot '.backend.pid'

if (-not (Test-Path $pidFile)) {
  Write-Host 'No backend PID file found.'
  exit 0
}

$pidText = Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $pidText) {
  Remove-Item $pidFile -ErrorAction SilentlyContinue
  Write-Host 'PID file was empty; cleaned up.'
  exit 0
}

$process = Get-Process -Id $pidText -ErrorAction SilentlyContinue
if ($process) {
  Stop-Process -Id $pidText -Force
  Write-Host "Stopped backend process $pidText"
} else {
  Write-Host "No running process found for PID $pidText"
}

Remove-Item $pidFile -ErrorAction SilentlyContinue