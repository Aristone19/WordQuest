<#
  Word Quest - desktop build script.

  Compiles the native Windows shell with the .NET Framework compiler that ships
  with Windows, then copies the game files next to the resulting exe.
  No npm, Node, Visual Studio or internet connection is required.

  Usage:  powershell -ExecutionPolicy Bypass -File .\build.ps1
#>

[CmdletBinding()]
param(
  [switch]$SkipTests
)

# --- the WebView2 SDK. Vendored so the build needs no internet connection.
# Upstream: https://www.nuget.org/packages/Microsoft.Web.WebView2  (net462 + x64 loader)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$app      = Join-Path $PSScriptRoot '..\word-quest-game'
$buildDir = Join-Path $PSScriptRoot 'build'
$shimDir  = Join-Path $PSScriptRoot 'web-shim'
$outDir   = Join-Path $buildDir 'dist'
$outName  = 'WordQuest'

function Info($m)  { Write-Host "==> $m" -ForegroundColor Cyan }
function Ok($m)    { Write-Host "    $m" -ForegroundColor Green }
function Die($m)   { Write-Host "ERROR: $m" -ForegroundColor Red; exit 1 }

# ---------------------------------------------------------------- 1. toolchain
Info 'Locating the C# compiler'
$csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path $csc)) {
  $csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe'
}
if (-not (Test-Path $csc)) { Die 'csc.exe not found. This script needs the .NET Framework, which ships with Windows.' }
Ok "csc.exe at $csc"

$sdk = @(
  (Join-Path $PSScriptRoot 'build\Microsoft.Web.WebView2.Core.dll'),
  (Join-Path $PSScriptRoot 'build\Microsoft.Web.WebView2.WinForms.dll')
)
$loader = Join-Path $PSScriptRoot 'build\WebView2Loader.dll'
foreach ($f in $sdk + $loader) {
  if (-not (Test-Path $f)) { Die "Missing WebView2 SDK file: $f" }
}
Ok 'WebView2 SDK present'

if (-not (Test-Path $app)) { Die "Game folder not found: $app" }

# ---------------------------------------------------------------- 2. clean
Info 'Preparing output folder'
# The browser profile lives outside dist/ so a rebuild never collides with a
# running instance, and so shipping the folder stays clean.
$profile = Join-Path $buildDir 'profile'
if ($outDir -and (Test-Path $outDir)) { Remove-Item $outDir -Recurse -Force -ErrorAction SilentlyContinue }
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# ---------------------------------------------------------------- 3. compile
Info 'Compiling the native shell'
$refs = @(
  'System.dll', 'System.Core.dll', 'System.Drawing.dll',
  'System.Windows.Forms.dll', 'System.Runtime.InteropServices.dll'
) | ForEach-Object { "/reference:$_" }

$refs += $sdk | ForEach-Object { "/reference:$_" }

$src = Join-Path $PSScriptRoot 'src\Program.cs'
$exe = Join-Path $outDir "$outName.exe"

& $csc /nologo /target:winexe /platform:x64 /optimize+ /win32icon:"$(Join-Path $PSScriptRoot 'assets\WordQuest.ico')" `
      /out:"$exe" $refs "$src"
if ($LASTEXITCODE -ne 0) { Die 'Compilation failed (see the errors above).' }
Ok "built $outName.exe"

# ---------------------------------------------------------------- 4. assemble
Info 'Copying runtime files'
Copy-Item (Join-Path $PSScriptRoot 'build\*.dll') $outDir -Force
Ok 'WebView2 runtime libraries'

# The game itself. Copied (not referenced) so the app folder is self-contained.
$web = Join-Path $outDir 'web'
New-Item -ItemType Directory -Force -Path $web | Out-Null
foreach ($item in 'index.html', 'app.js', 'styles.css') {
  Copy-Item (Join-Path $app $item) $web -Force
}
Copy-Item (Join-Path $app 'images') $web -Recurse -Force
Ok 'game files'

# The bridge that mirrors the save to disk, injected before the game loads.
Copy-Item (Join-Path $shimDir 'host.js') $web -Force
Ok 'save bridge'

if (Test-Path (Join-Path $PSScriptRoot 'assets\WordQuest.ico')) {
  Copy-Item (Join-Path $PSScriptRoot 'assets\WordQuest.ico') $outDir -Force
  Ok 'application icon'
}

# A README next to the exe, so the folder explains itself.
@"
Word Quest - desktop edition

  Start the game : $outName.exe
  Your save     : %APPDATA%\WordQuest\wordQuestSave.json

  Profiles:
    The game asks who is playing when it starts. Create one profile per
    player; every profile is stored inside the save file above, so backing
    that file up backs all of them up. Use Export/Import on the profile
    screen to move one profile to another PC.

Inside the app:
  Game  > Reload          restart the current view
  View  > Full Screen     F11
  View  > Developer Tools inspect the page
  Help  > Open Save Folder

Requires the Microsoft Edge WebView2 Runtime (already present on Windows 11).
"@ | Set-Content -Path (Join-Path $outDir 'README.txt') -Encoding UTF8

# ---------------------------------------------------------------- 5. verify
Info 'Verifying the build'
foreach ($required in "$outName.exe", 'Microsoft.Web.WebView2.Core.dll',
                        'Microsoft.Web.WebView2.WinForms.dll', 'WebView2Loader.dll',
                        'web\index.html', 'web\app.js', 'web\styles.css', 'web\host.js') {
  if (-not (Test-Path (Join-Path $outDir $required))) { Die "Build output is missing: $required" }
}
Ok 'all expected files present'

$sizeMb = [math]::Round(((Get-ChildItem $outDir -Recurse -File | Measure-Object Length -Sum).Sum / 1MB), 1)
Ok "package size ${sizeMb} MB"

Write-Host ''
Write-Host "Build complete." -ForegroundColor Green
Write-Host "Run it with:  `"$exe`"" -ForegroundColor Green
Write-Host ''
