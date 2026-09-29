#requires -Version 7.0
[CmdletBinding()]
param([string]$ExpectedFeatureDirectory, [switch]$Json, [switch]$Help)
$ErrorActionPreference = 'Stop'
if ($Help) {
    Write-Output 'setup-plan.ps1 -ExpectedFeatureDirectory <absolute path> [-Json] [-Help]'
    exit 0
}
try {
    . (Join-Path $PSScriptRoot 'common.ps1')
    $context = Get-SpecContext $ExpectedFeatureDirectory
    Assert-SpecFile $context.PROJECT_ROOT $context.FEATURE_SPEC
    $created = New-SpecDocument $context $context.IMPL_PLAN 'plan-template.md'
    $result = [pscustomobject]@{
        PROJECT_ROOT=$context.PROJECT_ROOT; FEATURE_DIR=$context.FEATURE_DIR
        FEATURE_SPEC=$context.FEATURE_SPEC; IMPL_PLAN=$context.IMPL_PLAN; CREATED=$created
    }
    Write-SpecResult $result -Json:$Json
    exit 0
} catch { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }
