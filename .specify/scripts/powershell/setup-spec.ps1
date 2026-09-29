#requires -Version 7.0
[CmdletBinding()]
param([string]$ExpectedFeatureDirectory, [switch]$Json, [switch]$Help)
$ErrorActionPreference = 'Stop'
if ($Help) {
    Write-Output 'setup-spec.ps1 -ExpectedFeatureDirectory <absolute path> [-Json] [-Help]'
    exit 0
}
try {
    . (Join-Path $PSScriptRoot 'common.ps1')
    $context = Get-SpecContext $ExpectedFeatureDirectory
    $created = New-SpecDocument $context $context.FEATURE_SPEC 'spec-template.md'
    $result = [pscustomobject]@{
        PROJECT_ROOT=$context.PROJECT_ROOT; FEATURE_DIR=$context.FEATURE_DIR
        FEATURE_SPEC=$context.FEATURE_SPEC; CREATED=$created
    }
    Write-SpecResult $result -Json:$Json
    exit 0
} catch { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }
