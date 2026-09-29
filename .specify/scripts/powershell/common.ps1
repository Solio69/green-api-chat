# Local adaptation of github/spec-kit. See docs/spec-kit-provenance.md.
$script:SpecKitProjectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..')).TrimEnd('\','/')

function Get-SpecAttributes([string]$Path) {
    try { return [IO.File]::GetAttributes($Path) }
    catch [IO.FileNotFoundException] { return $null }
    catch [IO.DirectoryNotFoundException] { return $null }
}
function Assert-SpecSafePath([string]$Root, [string]$Path) {
    $full = [IO.Path]::GetFullPath($Path).TrimEnd('\','/')
    if ($full -ne $Root -and -not $full.StartsWith($Root + '\', [StringComparison]::OrdinalIgnoreCase)) {
        throw "Path is outside the project: $full"
    }
    $paths = [Collections.Generic.List[string]]::new()
    $paths.Add($Root)
    if ($full -ne $Root) {
        $current = $Root
        foreach ($part in $full.Substring($Root.Length + 1).Split('\')) {
            $current = Join-Path $current $part
            $paths.Add($current)
        }
    }
    for ($i = 0; $i -lt $paths.Count; $i++) {
        $attributes = Get-SpecAttributes $paths[$i]
        if ($null -eq $attributes) { continue }
        if ($attributes -band [IO.FileAttributes]::ReparsePoint) {
            throw "Reparse point is not allowed: $($paths[$i])"
        }
        if ($i -lt $paths.Count - 1 -and -not ($attributes -band [IO.FileAttributes]::Directory)) {
            throw "Expected a directory: $($paths[$i])"
        }
    }
}
function Assert-SpecFile([string]$Root, [string]$Path) {
    Assert-SpecSafePath $Root $Path
    $attributes = Get-SpecAttributes $Path
    if ($null -eq $attributes -or ($attributes -band [IO.FileAttributes]::Directory)) {
        throw "Required regular file is missing: $Path"
    }
}
function Get-SpecContext([string]$ExpectedFeatureDirectory) {
    if (-not $IsWindows -or $PSVersionTable.PSVersion.Major -lt 7) {
        throw 'Windows and PowerShell 7 are required.'
    }
    $root = $script:SpecKitProjectRoot
    Assert-SpecSafePath $root (Join-Path $root '.specify/scripts/powershell')
    if (-not [IO.Directory]::Exists((Join-Path $root '.specify'))) {
        throw "Local .specify directory is missing: $root"
    }
    $location = Get-Location
    if ($location.Provider.Name -ne 'FileSystem') { throw 'Working directory must be a filesystem path.' }
    Assert-SpecSafePath $root $location.ProviderPath
    $selection = $env:SPECIFY_FEATURE_DIRECTORY
    if ([string]::IsNullOrWhiteSpace($selection)) { throw 'SPECIFY_FEATURE_DIRECTORY is required.' }
    if ([string]::IsNullOrWhiteSpace($ExpectedFeatureDirectory) -or
        -not [IO.Path]::IsPathFullyQualified($ExpectedFeatureDirectory)) {
        throw 'ExpectedFeatureDirectory must be an absolute path.'
    }
    $feature = [IO.Path]::GetFullPath($selection, $root).TrimEnd('\','/')
    $expected = [IO.Path]::GetFullPath($ExpectedFeatureDirectory).TrimEnd('\','/')
    if (-not $feature.Equals($expected, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'SPECIFY_FEATURE_DIRECTORY does not match ExpectedFeatureDirectory.'
    }
    $specs = Join-Path $root 'specs'
    $featureName = [IO.Path]::GetFileName($feature).ToLowerInvariant()
    if ([IO.Path]::GetDirectoryName($feature) -ne $specs -or
        $featureName -cnotmatch '^[0-9]{3,}-[a-z0-9]+(?:-[a-z0-9]+)*$') {
        throw 'Feature must be a direct specs/NNN-slug directory inside this project.'
    }
    $feature = Join-Path $specs $featureName
    Assert-SpecSafePath $root $feature
    $attributes = Get-SpecAttributes $feature
    if ($null -ne $attributes -and -not ($attributes -band [IO.FileAttributes]::Directory)) {
        throw "Feature is not a directory: $feature"
    }
    $context = [ordered]@{
        PROJECT_ROOT = $root
        FEATURE_DIR = $feature
        FEATURE_SPEC = Join-Path $feature 'spec.md'
        IMPL_PLAN = Join-Path $feature 'plan.md'
        TASKS = Join-Path $feature 'tasks.md'
    }
    foreach ($key in @('FEATURE_SPEC','IMPL_PLAN','TASKS')) { Assert-SpecSafePath $root $context[$key] }
    return [pscustomobject]$context
}
function Get-SpecAvailableDocs($Context, [switch]$IncludeTasks) {
    $names = @('research.md','data-model.md','contracts/','quickstart.md')
    if ($IncludeTasks) { $names += 'tasks.md' }
    foreach ($name in $names) {
        $path = Join-Path $Context.FEATURE_DIR $name
        Assert-SpecSafePath $Context.PROJECT_ROOT $path
        $attributes = Get-SpecAttributes $path
        if ($null -eq $attributes) { continue }
        if ($name -eq 'contracts/') {
            if (-not ($attributes -band [IO.FileAttributes]::Directory)) { throw "Expected directory: $path" }
        } elseif ($attributes -band [IO.FileAttributes]::Directory) { throw "Expected regular file: $path" }
        $name
    }
}
function New-SpecDocument($Context, [string]$Path, [string]$TemplateName) {
    Assert-SpecSafePath $Context.PROJECT_ROOT $Path
    $attributes = Get-SpecAttributes $Path
    if ($null -ne $attributes) {
        Assert-SpecFile $Context.PROJECT_ROOT $Path
        return $false
    }
    $template = Join-Path $Context.PROJECT_ROOT ".specify/templates/$TemplateName"
    Assert-SpecFile $Context.PROJECT_ROOT $template
    $bytes = [IO.File]::ReadAllBytes($template)
    $stream = $null
    $created = $false
    try {
        $null = [IO.Directory]::CreateDirectory($Context.FEATURE_DIR)
        Assert-SpecSafePath $Context.PROJECT_ROOT $Path
        # CreateNew also protects the gap between the existence check and opening.
        $stream = [IO.File]::Open($Path, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
        $created = $true
        $stream.Write($bytes, 0, $bytes.Length)
        $stream.Flush()
    } catch {
        $partial = if ($created) { ' The newly created file may be partial; inspect it before retrying.' } else { '' }
        throw "Cannot create document '$Path': $($_.Exception.Message)$partial"
    } finally { if ($null -ne $stream) { $stream.Dispose() } }
    return $true
}
function Write-SpecResult($Value, [switch]$Json) {
    if ($Json) { $Value | ConvertTo-Json -Depth 5 -Compress }
    else { $Value }
}
