param(
    [Parameter(Mandatory=$true)]
    [string]$Project
)

$Project=(
    Resolve-Path $Project
).Path

$gate=(
    Join-Path `
        $PSScriptRoot `
        "security-gate.mjs"
)

Push-Location $Project

try {

    git rev-parse --is-inside-work-tree *> $null

    if($LASTEXITCODE -ne 0){
        throw "NOT_A_GIT_REPOSITORY"
    }

    $hooksPath=(
        git rev-parse --git-path hooks
    ).Trim()

    if(-not [System.IO.Path]::IsPathRooted($hooksPath)){
        $hooksPath=
            Join-Path `
                $Project `
                $hooksPath
    }

    New-Item `
        -ItemType Directory `
        -Force `
        -Path $hooksPath |
        Out-Null

    $hook=
        Join-Path `
            $hooksPath `
            "pre-commit"

    $backup=
        Join-Path `
            $hooksPath `
            "pre-commit.pre-engineer-flow"

    if(
        (Test-Path $hook) -and
        -not (
            (Get-Content $hook -Raw) -match
            "ENGINEER_FLOW_SECURITY_GATE"
        )
    ){
        Copy-Item `
            $hook `
            $backup `
            -Force
    }

    $gateUnix=
        $gate.Replace("\","/")

    $backupUnix=
        $backup.Replace("\","/")

    $hookContent=@"
#!/bin/sh

# ENGINEER_FLOW_SECURITY_GATE

if [ -f "$backupUnix" ]; then
    sh "$backupUnix"
    PREVIOUS_EXIT=`$?

    if [ `$PREVIOUS_EXIT -ne 0 ]; then
        exit `$PREVIOUS_EXIT
    fi
fi

node "$gateUnix" check --cwd "`$(pwd)"
exit `$?
"@

    [System.IO.File]::WriteAllText(
        $hook,
        $hookContent,
        (New-Object System.Text.UTF8Encoding($false))
    )

    Write-Host "SECURITY_GATE_INSTALLED=YES"
    Write-Host "PROJECT=$Project"
    Write-Host "HOOK=$hook"

}
finally {
    Pop-Location
}