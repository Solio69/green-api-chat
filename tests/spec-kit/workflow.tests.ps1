#requires -Version 7.0
[CmdletBinding()]
param([ValidateSet('V01','V02','V03','V04','V05','V06','V07','V08','V09','V10','V11','V12')][string[]]$Case = @())
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if (-not $IsWindows) { throw 'Contract tests require Windows and PowerShell 7.' }
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$pwshPath = (Get-Process -Id $PID).Path
foreach ($name in @('common','check-prerequisites','setup-spec','setup-plan','setup-tasks')) {
    if (-not (Test-Path -LiteralPath "$projectRoot/.specify/scripts/powershell/$name.ps1" -PathType Leaf)) {
        throw "Infrastructure missing: $name.ps1. No behavioral test has run."
    }
}
$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('green-api-speckit-' + [guid]::NewGuid().ToString('N'))
$null = [IO.Directory]::CreateDirectory($testRoot)
$results = [Collections.Generic.List[object]]::new()
$callCount = 0
function Assert-True([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
}
function Get-Snapshot([string]$Root) {
    @(Get-ChildItem -LiteralPath $Root -Recurse -Force -File | Sort-Object FullName |
        ForEach-Object { $_.FullName + ':' + (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash }
    ) -join [Environment]::NewLine
}
function New-Fixture([string]$Name) {
    $root = Join-Path $testRoot $Name
    foreach ($part in @('scripts/powershell','templates')) {
        $destination = Join-Path $root ".specify/$part"
        $null = [IO.Directory]::CreateDirectory($destination)
        foreach ($item in Get-ChildItem -LiteralPath "$projectRoot/.specify/$part" -File) {
            [IO.File]::Copy($item.FullName, (Join-Path $destination $item.Name), $false)
        }
    }
    return $root
}
function Add-Document([string]$Path, [string]$Content = 'fixture content') {
    $null = [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($Path))
    [IO.File]::WriteAllText($Path, $Content, [Text.UTF8Encoding]::new($false))
}
function Invoke-Tool {
    param([string]$Root, [string]$Name = 'check-prerequisites',
        [hashtable]$Options = @{Json=$true;PathsOnly=$true},
        [AllowNull()][string]$Feature, [AllowNull()][string]$Expected,
        [string]$Cwd = $Root, [switch]$OmitExpected)
    $script:callCount++
    $marker = Join-Path $testRoot ('git-call-' + $script:callCount)
    $parameters = @{}
    foreach ($key in $Options.Keys) { $parameters[$key] = $Options[$key] }
    if (-not $OmitExpected) { $parameters.ExpectedFeatureDirectory = $Expected }
    $payload = @{Script=Join-Path $Root ".specify/scripts/powershell/$Name.ps1"
        Feature=$Feature;Parameters=$parameters;Marker=$marker} | ConvertTo-Json -Compress
    $encodedPayload = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($payload))
    $wrapper = @'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$p = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('__PAYLOAD__')) | ConvertFrom-Json
$env:SPECIFY_TEST_GIT_MARKER = $p.Marker
function global:git { [IO.File]::WriteAllText($env:SPECIFY_TEST_GIT_MARKER,'called'); throw 'Git must not run' }
function global:git.exe { [IO.File]::WriteAllText($env:SPECIFY_TEST_GIT_MARKER,'called'); throw 'Git must not run' }
$env:SPECIFY_FEATURE_DIRECTORY = $p.Feature
$parameters = @{}
foreach ($property in $p.Parameters.PSObject.Properties) { $parameters[$property.Name] = $property.Value }
$global:LASTEXITCODE = 0
try { & $p.Script @parameters; exit $LASTEXITCODE }
catch { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }
'@
    $wrapper = $wrapper.Replace('__PAYLOAD__', $encodedPayload)
    $start = [Diagnostics.ProcessStartInfo]::new($pwshPath)
    $start.WorkingDirectory = $Cwd
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $start.StandardOutputEncoding = [Text.UTF8Encoding]::new($false)
    $start.StandardErrorEncoding = [Text.UTF8Encoding]::new($false)
    foreach ($arg in @('-NoLogo','-NoProfile','-NonInteractive','-EncodedCommand',
        [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($wrapper)))) { $start.ArgumentList.Add($arg) }
    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $start
    try {
        $null = $process.Start()
        $stdoutTask = $process.StandardOutput.ReadToEndAsync()
        $stderrTask = $process.StandardError.ReadToEndAsync()
        if (-not $process.WaitForExit(20000)) { $process.Kill($true); throw "Tool timeout: $Name" }
        $stdout = $stdoutTask.GetAwaiter().GetResult()
        $stderr = $stderrTask.GetAwaiter().GetResult()
        Assert-True (-not (Test-Path -LiteralPath $marker)) "Unexpected Git invocation: $Name"
        return [pscustomobject]@{Code=$process.ExitCode;Out=$stdout;Err=$stderr}
    } finally { $process.Dispose() }
}
function Assert-Success($Result) {
    Assert-True ($Result.Code -eq 0) "Expected success, got $($Result.Code): $($Result.Err)"
    Assert-True ([string]::IsNullOrWhiteSpace($Result.Err)) "Unexpected stderr: $($Result.Err)"
    return ($Result.Out | ConvertFrom-Json -ErrorAction Stop)
}
function Assert-Failure($Result, [string]$Reason) {
    Assert-True ($Result.Code -ne 0) "Expected failure: $Reason"
    Assert-True ([string]::IsNullOrWhiteSpace($Result.Out)) "Error emitted stdout: $Reason"
    Assert-True (-not [string]::IsNullOrWhiteSpace($Result.Err)) "Missing error explanation: $Reason"
}
function Test-Case([string]$Id, [scriptblock]$Body) {
    if ($Case.Count -gt 0 -and $Id -notin $Case) { return }
    try { & $Body; $results.Add([pscustomobject]@{Id=$Id;Status='Passed';Detail=''}) }
    catch {
        $status = if ($_.Exception.Message.StartsWith('BLOCKED:')) {'Blocked'} else {'Failed'}
        $results.Add([pscustomobject]@{Id=$Id;Status=$status;Detail=$_.Exception.Message})
    }
}
function Remove-OwnedFixture([string]$Path) {
    $full = [IO.Path]::GetFullPath($Path)
    $expected = [IO.Path]::GetFullPath($testRoot)
    if ($expected -eq [IO.Path]::GetPathRoot($expected) -or
        -not $expected.StartsWith([IO.Path]::GetFullPath([IO.Path]::GetTempPath()), [StringComparison]::OrdinalIgnoreCase) -or
        -not ([IO.Path]::GetFileName($expected) -match '^green-api-speckit-[0-9a-f]{32}$') -or
        ($full -ne $expected -and -not $full.StartsWith($expected + '\', [StringComparison]::OrdinalIgnoreCase))) {
        throw "Refusing cleanup outside owned fixture: $full"
    }
    $item = Get-Item -LiteralPath $full -Force
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { Remove-Item -LiteralPath $full -Force }
    elseif ($item.PSIsContainer) {
        foreach ($child in Get-ChildItem -LiteralPath $full -Force) { Remove-OwnedFixture $child.FullName }
        Remove-Item -LiteralPath $full -Force
    } else { Remove-Item -LiteralPath $full -Force }
}
try {
    Test-Case V01 {
        $root=New-Fixture 'проект с пробелами'; $feature=Join-Path $root 'specs/001-fixture'
        $nested=Join-Path $root 'nested'; $null=[IO.Directory]::CreateDirectory($nested)
        $a=Assert-Success (Invoke-Tool -Root $root -Feature $feature -Expected $feature)
        $b=Assert-Success (Invoke-Tool -Root $root -Feature $feature -Expected $feature -Cwd $nested)
        Assert-True ($a.PROJECT_ROOT -eq $root -and $a.FEATURE_DIR -eq $feature) "Wrong context: root=$($a.PROJECT_ROOT); expectedRoot=$root; feature=$($a.FEATURE_DIR); expectedFeature=$feature"
        Assert-True ($a.PROJECT_ROOT -eq $b.PROJECT_ROOT -and $a.FEATURE_DIR -eq $b.FEATURE_DIR) 'Cwd dependency'
        Assert-True (-not (Test-Path -LiteralPath "$root/.git")) 'Repository created'
    }
    Test-Case V02 {
        $root=New-Fixture 'missing-context'; $feature=Join-Path $root 'specs/001-fixture'
        foreach ($missing in @($null,'',' ')) { Assert-Failure (Invoke-Tool -Root $root -Feature $missing -Expected $feature) 'missing env' }
        Assert-Failure (Invoke-Tool -Root $root -Feature $feature -OmitExpected) 'missing expected'
        Assert-Failure (Invoke-Tool -Root $root -Feature $feature -Expected 'specs/001-fixture') 'relative expected'
    }
    Test-Case V03 {
        $root=New-Fixture 'boundary'; $outside=Join-Path $testRoot 'boundary-neighbor/specs/001-fixture'
        Add-Document "$outside/spec.md" 'outside sentinel'; $before=Get-Snapshot $testRoot
        foreach ($selection in @($outside,'../boundary-neighbor/specs/001-fixture')) {
            Assert-Failure (Invoke-Tool -Root $root -Name setup-spec -Options @{Json=$true} -Feature $selection -Expected $outside) 'outside'
        }
        foreach ($invalid in @('specs/not-numbered','specs/001-x/child')) {
            $path=Join-Path $root $invalid
            Assert-Failure (Invoke-Tool -Root $root -Feature $path -Expected $path) 'invalid shape'
        }
        Assert-True ((Get-Snapshot $testRoot) -ceq $before) 'Outside selection changed files'
    }
    Test-Case V04 {
        $root=New-Fixture 'mismatch'; $feature=Join-Path $root 'specs/001-fixture'; $other=Join-Path $root 'specs/002-other'
        Add-Document "$feature/spec.md"; Add-Document "$other/spec.md" 'other sentinel'; $before=Get-Snapshot $root
        Assert-Failure (Invoke-Tool -Root $root -Name setup-plan -Options @{Json=$true} -Feature $other -Expected $feature) 'mismatch'
        Assert-Failure (Invoke-Tool -Root $root -Feature $feature -Expected $feature -Cwd $testRoot) 'outside cwd'
        Assert-True ((Get-Snapshot $root) -ceq $before) 'Wrong feature changed'
    }
    Test-Case V05 {
        $root=New-Fixture 'links'; $outside=Join-Path $testRoot 'link-target'
        Add-Document "$outside/sentinel.md" 'untouched target'; $before=Get-Snapshot $outside
        $null=[IO.Directory]::CreateDirectory("$root/specs"); $feature=Join-Path $root 'specs/001-linked'
        try { $null=New-Item -ItemType Junction -Path $feature -Target $outside }
        catch { throw "BLOCKED: cannot create junction fixture: $($_.Exception.Message)" }
        Assert-Failure (Invoke-Tool -Root $root -Name setup-spec -Options @{Json=$true} -Feature $feature -Expected $feature) 'junction feature'
        Assert-Failure (Invoke-Tool -Root $root -Feature $feature -Expected $feature) 'junction PathsOnly'
        $normal=Join-Path $root 'specs/002-normal'; $null=[IO.Directory]::CreateDirectory($normal)
        $null=New-Item -ItemType Junction -Path "$normal/spec.md" -Target $outside
        Assert-Failure (Invoke-Tool -Root $root -Name setup-spec -Options @{Json=$true} -Feature $normal -Expected $normal) 'junction artifact'
        Assert-True ((Get-Snapshot $outside) -ceq $before) 'Link target changed'
    }
    Test-Case V06 {
        $root=New-Fixture 'ещё пробелы'; $feature=Join-Path $root 'specs/001-fixture'
        $variant=$feature.ToUpperInvariant().Replace('\','/')
        $result=Assert-Success (Invoke-Tool -Root $root -Feature $variant -Expected $feature)
        Assert-True ($result.FEATURE_DIR -eq $feature) "Windows normalization mismatch: actual=$($result.FEATURE_DIR); expected=$feature"
        $result=Assert-Success (Invoke-Tool -Root $root -Feature 'specs/001-fixture' -Expected $feature)
        Assert-True ($result.FEATURE_DIR -eq $feature) 'Relative selection mismatch'
    }
    Test-Case V07 {
        $root=New-Fixture 'repeat'; $feature=Join-Path $root 'specs/001-fixture'
        foreach ($entry in @(@('setup-spec','spec.md'),@('setup-plan','plan.md'))) {
            $first=Assert-Success (Invoke-Tool -Root $root -Name $entry[0] -Options @{Json=$true} -Feature $feature -Expected $feature)
            Assert-True ($first.CREATED -eq $true) 'First setup did not create'
            Add-Document "$feature/$($entry[1])" "user document $($entry[1])"
            $hash=(Get-FileHash -LiteralPath "$feature/$($entry[1])").Hash
            $again=Assert-Success (Invoke-Tool -Root $root -Name $entry[0] -Options @{Json=$true} -Feature $feature -Expected $feature)
            Assert-True ($again.CREATED -eq $false) 'Repeat claimed creation'
            Assert-True ((Get-FileHash -LiteralPath "$feature/$($entry[1])").Hash -eq $hash) 'Document overwritten'
            Remove-OwnedFixture "$root/.specify/templates/$([IO.Path]::GetFileNameWithoutExtension($entry[1]))-template.md"
            $preserved=Assert-Success (Invoke-Tool -Root $root -Name $entry[0] -Options @{Json=$true} -Feature $feature -Expected $feature)
            Assert-True ($preserved.CREATED -eq $false) 'Existing document required a template'
        }
    }
    Test-Case V08 {
        $root=New-Fixture 'modes'; $feature=Join-Path $root 'specs/001-fixture'
        $null=Assert-Success (Invoke-Tool -Root $root -Feature $feature -Expected $feature)
        Assert-Failure (Invoke-Tool -Root $root -Options @{Json=$true;RequireSpec=$true} -Feature $feature -Expected $feature) 'missing spec'
        Assert-Failure (Invoke-Tool -Root $root -Name setup-plan -Options @{Json=$true} -Feature $feature -Expected $feature) 'plan before spec'
        Add-Document "$feature/spec.md"
        $null=Assert-Success (Invoke-Tool -Root $root -Options @{Json=$true;RequireSpec=$true} -Feature $feature -Expected $feature)
        Assert-Failure (Invoke-Tool -Root $root -Options @{Json=$true} -Feature $feature -Expected $feature) 'missing plan'
        Add-Document "$feature/plan.md"
        $null=Assert-Success (Invoke-Tool -Root $root -Options @{Json=$true} -Feature $feature -Expected $feature)
        Assert-Failure (Invoke-Tool -Root $root -Options @{Json=$true;RequireTasks=$true} -Feature $feature -Expected $feature) 'missing tasks'
        Add-Document "$feature/tasks.md"
        $null=Assert-Success (Invoke-Tool -Root $root -Options @{Json=$true;RequireTasks=$true} -Feature $feature -Expected $feature)
        $before=Get-Snapshot $root
        foreach ($pair in @(@('PathsOnly','RequireSpec'),@('PathsOnly','RequireTasks'),@('RequireSpec','RequireTasks'))) {
            $options=@{Json=$true}; foreach ($flag in $pair) {$options[$flag]=$true}
            Assert-Failure (Invoke-Tool -Root $root -Options $options -Feature $feature -Expected $feature) 'conflicting modes'
        }
        Assert-True ((Get-Snapshot $root) -ceq $before) 'Mode check wrote files'
    }
    Test-Case V09 {
        foreach ($entry in @(@('setup-spec','spec'),@('setup-plan','plan'),@('setup-tasks','tasks'))) {
            $root=New-Fixture ("missing-template-" + $entry[1]); $feature=Join-Path $root 'specs/001-fixture'
            if ($entry[1] -ne 'spec') { Add-Document "$feature/spec.md" }
            if ($entry[1] -eq 'tasks') { Add-Document "$feature/plan.md" }
            Remove-OwnedFixture "$root/.specify/templates/$($entry[1])-template.md"
            Assert-Failure (Invoke-Tool -Root $root -Name $entry[0] -Options @{Json=$true} -Feature $feature -Expected $feature) 'missing template'
            Assert-True (-not (Test-Path -LiteralPath "$feature/$($entry[1]).md")) 'Empty artifact created'
            if ($entry[1] -eq 'spec') { Assert-True (-not (Test-Path -LiteralPath $feature)) 'Empty feature created' }
        }
        $root=New-Fixture 'directory-artifact'; $feature=Join-Path $root 'specs/001-fixture'
        $null=[IO.Directory]::CreateDirectory("$feature/spec.md")
        Assert-Failure (Invoke-Tool -Root $root -Name setup-spec -Options @{Json=$true} -Feature $feature -Expected $feature) 'directory spec'
        Assert-Failure (Invoke-Tool -Root $root -Options @{Json=$true;RequireSpec=$true} -Feature $feature -Expected $feature) 'directory prerequisite'
    }
    Test-Case V10 {
        $root=New-Fixture 'output'; $feature=Join-Path $root 'specs/001-fixture'
        foreach ($name in @('check-prerequisites','setup-spec','setup-plan','setup-tasks')) {
            $help=Invoke-Tool -Root $root -Name $name -Options @{Help=$true} -Feature $null -OmitExpected -Cwd $testRoot
            Assert-True ($help.Code -eq 0 -and $help.Out -match 'ExpectedFeatureDirectory') 'Help contract failed'
            Assert-True ([string]::IsNullOrWhiteSpace($help.Err)) 'Help stderr'
        }
        Add-Document "$feature/tasks.md"
        $result=Assert-Success (Invoke-Tool -Root $root -Feature $feature -Expected $feature -Options @{Json=$true;PathsOnly=$true;IncludeTasks=$true})
        Assert-True ($result.AVAILABLE_DOCS -is [array] -and $result.AVAILABLE_DOCS.Count -eq 0) 'PathsOnly exposed docs'
        Assert-True ('BRANCH' -notin $result.PSObject.Properties.Name) 'Branch field exposed'
        Assert-Failure (Invoke-Tool -Root $root -Feature $null -Expected $feature) 'error streams'
    }
    Test-Case V11 {
        $root=New-Fixture 'read-only'; $feature=Join-Path $root 'specs/001-fixture'
        foreach ($name in @('spec','plan','tasks','research','data-model','quickstart')) { Add-Document "$feature/$name.md" }
        Add-Document "$feature/contracts/sample.md"; $before=Get-Snapshot $root
        $import=Invoke-Tool -Root $root -Name common -Options @{} -Feature $null -OmitExpected
        Assert-True ($import.Code -eq 0 -and [string]::IsNullOrWhiteSpace($import.Out) -and [string]::IsNullOrWhiteSpace($import.Err)) 'Library import had side effects'
        $a=Assert-Success (Invoke-Tool -Root $root -Feature $feature -Expected $feature -Options @{Json=$true;RequireTasks=$true;IncludeTasks=$true})
        Assert-True ('tasks.md' -in $a.AVAILABLE_DOCS -and 'contracts/' -in $a.AVAILABLE_DOCS) 'Docs incomplete'
        $b=Assert-Success (Invoke-Tool -Root $root -Name setup-tasks -Options @{Json=$true} -Feature $feature -Expected $feature)
        Assert-True ([IO.Path]::IsPathFullyQualified($b.TASKS_TEMPLATE)) 'Template not absolute'
        Assert-True ((Get-Snapshot $root) -ceq $before) 'Read-only scripts changed files'
    }
    Test-Case V12 {
        $root=New-Fixture 'standalone'; $feature=Join-Path $root 'specs/001-fixture'
        foreach ($name in @('setup-spec','setup-plan','setup-tasks')) {
            $result=Assert-Success (Invoke-Tool -Root $root -Name $name -Options @{Json=$true} -Feature $feature -Expected $feature)
            Assert-True ($result.PROJECT_ROOT -eq $root -and $result.FEATURE_DIR -eq $feature) 'External dependency'
        }
        Assert-True (-not (Test-Path -LiteralPath "$feature/tasks.md")) 'setup-tasks wrote tasks'
    }
} finally {
    try { Remove-OwnedFixture $testRoot }
    catch { $results.Add([pscustomobject]@{Id='Cleanup';Status='Blocked';Detail="Fixture retained: $testRoot. $($_.Exception.Message)"}) }
}
[pscustomobject]@{
    Results=@($results);Passed=@($results | Where-Object Status -eq Passed).Count
    Failed=@($results | Where-Object Status -eq Failed).Count
    Blocked=@($results | Where-Object Status -eq Blocked).Count
    ToolInvocations=$callCount
} | ConvertTo-Json -Depth 5
if (@($results | Where-Object Status -eq Failed).Count) { exit 1 }
if (@($results | Where-Object Status -eq Blocked).Count) { exit 2 }
exit 0
