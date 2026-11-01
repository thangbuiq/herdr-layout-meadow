# Installs the Meadow layout and its themes into the Herdr app on Windows.
#   .\setup.cmd               install, check the mods and switch to Meadow
#   .\setup.cmd -NoSwitch     install without switching
#   .\setup.cmd -Uninstall    remove it (a copy goes to the backups folder first)
param([switch]$NoSwitch, [switch]$Uninstall)
$ErrorActionPreference = "Stop"

$Src = $PSScriptRoot

# The same lookup the app uses.
$HomeDir = if ($env:HERDR_APP_HOME) { $env:HERDR_APP_HOME }
    elseif ($env:XDG_CONFIG_HOME) { Join-Path $env:XDG_CONFIG_HOME "herdr-app" }
    else { Join-Path (Join-Path $HOME ".config") "herdr-app" }
$App = (Get-Command herdr-app -ErrorAction SilentlyContinue).Source

if (-not (Test-Path (Join-Path $HomeDir "AGENTS.md"))) {
    Write-Host "Note: $HomeDir doesn't look used yet. Open Herdr once if the layout doesn't appear."
}

$Items = @(
    "layouts\meadow.json", "layouts\meadow.svg",
    "themes\meadow-dark.json", "themes\meadow-light.json",
    "mods\meadow-field", "mods\meadow-spaces", "mods\meadow-agents"
)
$Backup = Join-Path (Join-Path $HomeDir ".meadow-backups") (Get-Date -Format "yyyyMMdd-HHmmss")

function Backup-Items {
    foreach ($item in $Items) {
        $from = Join-Path $HomeDir $item
        if (Test-Path $from) {
            $to = Join-Path $Backup $item
            New-Item -ItemType Directory -Force -Path (Split-Path $to) | Out-Null
            Copy-Item -Recurse -Force $from $to
        }
    }
    if (Test-Path $Backup) { Write-Host "Backed up the previous copy to $Backup" }
}

if ($Uninstall) {
    Backup-Items
    # Leave the layout first, so the window never shows one that's gone.
    $env:HERDR_APP_HOME = $HomeDir
    if ($App) { try { & $App do layout.switch --name main *> $null } catch {} }
    foreach ($item in $Items) {
        $target = Join-Path $HomeDir $item
        if (Test-Path $target) { Remove-Item -Recurse -Force $target }
    }
    Write-Host "Meadow removed from $HomeDir"
    exit 0
}

Backup-Items
foreach ($dir in "layouts", "themes", "mods") {
    New-Item -ItemType Directory -Force -Path (Join-Path $HomeDir $dir) | Out-Null
}
foreach ($item in $Items) {
    $from = Join-Path $Src $item
    $to = Join-Path $HomeDir $item
    if (Test-Path $from -PathType Container) {
        # Copied over the top: the window keeps running from these folders.
        New-Item -ItemType Directory -Force -Path $to | Out-Null
        Copy-Item -Recurse -Force (Join-Path $from "*") $to
    } else {
        Copy-Item -Force $from $to
    }
}
Write-Host "Installed Meadow to $HomeDir"

if (-not $App) {
    Write-Host "herdr-app isn't on PATH, so the mods weren't checked. Open Herdr, then pick Meadow in Settings > Look or press ctrl-shift-l."
    exit 0
}

$env:HERDR_APP_HOME = $HomeDir
foreach ($mod in "meadow-field", "meadow-spaces", "meadow-agents") {
    & $App check (Join-Path (Join-Path $HomeDir "mods") $mod)
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if (-not $NoSwitch) {
    & $App do layout.switch --name meadow *> $null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Switched to Meadow. It follows your light or dark appearance. ctrl-shift-l cycles back to your others."
    } else {
        Write-Host "Herdr isn't open. Open it, then pick Meadow in Settings > Look or press ctrl-shift-l."
    }
}
