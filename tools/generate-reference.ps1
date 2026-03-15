param(
  [Parameter(Mandatory = $true)]
  [string]$DataFile
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$templatePath = Join-Path $PSScriptRoot "reference-template.html"
$dataPath = if ([System.IO.Path]::IsPathRooted($DataFile)) { $DataFile } else { Join-Path $root $DataFile }

if (-not (Test-Path $templatePath)) {
  throw "Template not found: $templatePath"
}
if (-not (Test-Path $dataPath)) {
  throw "Data file not found: $dataPath"
}

$data = Get-Content -Path $dataPath -Raw | ConvertFrom-Json

if (-not $data.title -or -not $data.description -or -not $data.output -or -not $data.images) {
  throw "Data file must contain: title, description, images[], output"
}

if ($data.images.Count -lt 1) {
  throw "At least one image is required in images[]"
}

$template = Get-Content -Path $templatePath -Raw
$imagesHtml = ($data.images | ForEach-Object { "<img src=""$_"">" }) -join "`r`n"

$result = $template.
  Replace("{{TITLE}}", [string]$data.title).
  Replace("{{DESCRIPTION}}", [string]$data.description).
  Replace("{{GALLERY_IMAGES}}", $imagesHtml)

$outputPath = if ([System.IO.Path]::IsPathRooted([string]$data.output)) {
  [string]$data.output
} else {
  Join-Path $root ([string]$data.output)
}

$outputDir = Split-Path -Parent $outputPath
if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outputPath, $result, $utf8NoBom)

Write-Host "Generated: $outputPath"
