#requires -Version 7.0
[CmdletBinding()]
param(
    [string]$ExpectedFeatureDirectory,
    [switch]$Json, [switch]$PathsOnly, [switch]$RequireSpec,
    [switch]$RequireTasks, [switch]$IncludeTasks, [switch]$Help
)
$ErrorActionPreference = 'Stop'
if ($Help) {
    Write-Output 'check-prerequisites.ps1 -ExpectedFeatureDirectory <absolute path> [-Json] [-PathsOnly | -RequireSpec | -RequireTasks] [-IncludeTasks] [-Help]'
    exit 0
}
try {
    . (Join-Path $PSScriptRoot 'common.ps1')
    if (([int]$PathsOnly.IsPresent + [int]$RequireSpec.IsPresent + [int]$RequireTasks.IsPresent) -gt 1) {
        throw 'PathsOnly, RequireSpec and RequireTasks are mutually exclusive.'
    }
    $context = Get-SpecContext $ExpectedFeatureDirectory
    $docs = @()
    if (-not $PathsOnly) {
        Assert-SpecFile $context.PROJECT_ROOT $context.FEATURE_SPEC
        if (-not $RequireSpec) { Assert-SpecFile $context.PROJECT_ROOT $context.IMPL_PLAN }
        if ($RequireTasks) { Assert-SpecFile $context.PROJECT_ROOT $context.TASKS }
        $docs = @(Get-SpecAvailableDocs $context -IncludeTasks:$IncludeTasks)
    }
    $result = [ordered]@{}
    foreach ($property in $context.PSObject.Properties) { $result[$property.Name] = $property.Value }
    $result.AVAILABLE_DOCS = $docs
    Write-SpecResult ([pscustomobject]$result) -Json:$Json
    exit 0
} catch { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }
