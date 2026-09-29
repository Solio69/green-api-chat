#requires -Version 7.0
[CmdletBinding()]
param([string]$ExpectedFeatureDirectory, [switch]$Json, [switch]$Help)
$ErrorActionPreference = 'Stop'
if ($Help) {
    Write-Output 'setup-tasks.ps1 -ExpectedFeatureDirectory <absolute path> [-Json] [-Help]'
    exit 0
}
try {
    . (Join-Path $PSScriptRoot 'common.ps1')
    $context = Get-SpecContext $ExpectedFeatureDirectory
    Assert-SpecFile $context.PROJECT_ROOT $context.FEATURE_SPEC
    Assert-SpecFile $context.PROJECT_ROOT $context.IMPL_PLAN
    $template = Join-Path $context.PROJECT_ROOT '.specify/templates/tasks-template.md'
    Assert-SpecFile $context.PROJECT_ROOT $template
    $result = [pscustomobject]@{
        PROJECT_ROOT=$context.PROJECT_ROOT; FEATURE_DIR=$context.FEATURE_DIR; TASKS=$context.TASKS
        TASKS_TEMPLATE=$template; AVAILABLE_DOCS=@(Get-SpecAvailableDocs $context)
    }
    Write-SpecResult $result -Json:$Json
    exit 0
} catch { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }
