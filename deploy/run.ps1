# Menjalankan RapiMakalah dengan konfigurasi lokal.
# Jalankan dari root proyek: powershell -ExecutionPolicy Bypass -File deploy\run.ps1
$ErrorActionPreference = 'Stop'
$root   = Split-Path $PSScriptRoot -Parent
$server = Join-Path $root 'server'
$envFile = Join-Path $server '.env.production'
$cfg     = Join-Path $PSScriptRoot 'cloudflared-config.yml'

if (-not (Test-Path $envFile)) { throw 'server\.env.production tidak ada. Buat ulang dari deploy\env.production.example.' }
if ((Get-Content $envFile -Raw) -match 'GANTI_DENGAN') { throw 'JWT_SECRET masih placeholder. Isi dulu di server\.env.production.' }
if (-not (Test-Path $cfg)) { throw 'Buat deploy\cloudflared-config.yml dari deploy\cloudflared-config.example.yml.' }

Write-Host '[1/2] Build client...'
npm --prefix (Join-Path $root 'client') run build

Write-Host '[2/2] Jalankan server dan tunnel...'

foreach ($line in Get-Content $envFile) {
  if ($line -match '^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$' -and -not $line.TrimStart().StartsWith('#')) {
    Set-Item -Path "Env:$($Matches[1])" -Value $Matches[2]
  }
}
$srv = Start-Process -FilePath 'node' -ArgumentList 'src/index.js' -WorkingDirectory $server -PassThru -NoNewWindow
Start-Sleep -Seconds 3
if ($srv.HasExited) { throw "Server berhenti saat start (exit $($srv.ExitCode)). Periksa port $env:PORT dan log server." }
Write-Host "Server jalan di http://localhost:$env:PORT"
Write-Host 'Tunnel aktif sesuai hostname lokal (Ctrl+C untuk berhenti)'
try {
  cloudflared tunnel --config $cfg run
} finally {
  if ($srv -and -not $srv.HasExited) { Stop-Process -Id $srv.Id -Force }
}