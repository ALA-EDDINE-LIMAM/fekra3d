$ErrorActionPreference = 'Stop'

$backendRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $backendRoot '.backend.pid'
$logDir = Join-Path $backendRoot 'logs'
$stdoutLog = Join-Path $logDir 'backend.out.log'
$stderrLog = Join-Path $logDir 'backend.err.log'

$existingListener = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($existingListener) {
  Set-Content -Path $pidFile -Value $existingListener.OwningProcess
  Write-Host "Backend already running on PID $($existingListener.OwningProcess)"
  Write-Host "Logs: $stdoutLog and $stderrLog"
  exit 0
}

if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir | Out-Null
}

if (Test-Path $pidFile) {
  $existingPid = Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($existingPid) {
    $existingProcess = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    if ($existingProcess) {
      Write-Host "Backend already running on PID $existingPid"
      exit 0
    }
  }
}

$process = Start-Process `
  -FilePath 'node' `
  -ArgumentList 'index.js' `
  -WorkingDirectory $backendRoot `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog `
  -PassThru

Set-Content -Path $pidFile -Value $process.Id
Write-Host "Backend started in background with PID $($process.Id)"
Write-Host "Logs: $stdoutLog and $stderrLog"