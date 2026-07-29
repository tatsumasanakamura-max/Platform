param(
  [ValidateSet('chromium', 'webkit')]
  [string]$Project = 'chromium'
)

$ErrorActionPreference = 'Stop'
$viteProcess = Start-Process `
  -FilePath 'node.exe' `
  -ArgumentList 'node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4173', '--strictPort' `
  -WorkingDirectory (Get-Location) `
  -WindowStyle Hidden `
  -PassThru `
  -RedirectStandardOutput 'vite-e2e.out.log' `
  -RedirectStandardError 'vite-e2e.err.log'

try {
  $ready = $false
  for ($attempt = 0; $attempt -lt 40; $attempt += 1) {
    try {
      Invoke-WebRequest -Uri 'http://127.0.0.1:4173' -UseBasicParsing -TimeoutSec 1 | Out-Null
      $ready = $true
      break
    }
    catch {
      Start-Sleep -Milliseconds 250
    }
  }

  if (-not $ready) {
    throw 'Vite did not become ready'
  }

  $env:PLAYWRIGHT_EXTERNAL_SERVER = '1'
  if ($Project -eq 'webkit') {
    & npx.cmd playwright test '--project=chromium' '--project=webkit' '--reporter=line'
  }
  else {
    & npx.cmd playwright test '--project=chromium' '--reporter=line'
  }
  exit $LASTEXITCODE
}
finally {
  Remove-Item Env:PLAYWRIGHT_EXTERNAL_SERVER -ErrorAction SilentlyContinue
  if (-not $viteProcess.HasExited) {
    Stop-Process -Id $viteProcess.Id -Force
  }
}
