param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [string]$OutputDir = "data"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $InputPath)) {
  throw "Input file not found: $InputPath"
}

if (-not (Test-Path -LiteralPath $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$items = Get-Content -LiteralPath $InputPath -Raw | ConvertFrom-Json

if ($items -isnot [System.Collections.IEnumerable]) {
  throw "Expected a JSON array exported from Zotero."
}

$typeMap = @{
  "pub-articles.json"    = @("article-journal", "article-magazine", "article-newspaper")
  "pub-books.json"       = @("book", "chapter", "entry-encyclopedia", "entry-dictionary")
  "pub-conferences.json" = @("paper-conference", "speech", "presentation")
  "pub-theses.json"      = @("thesis", "dissertation")
}

$assignedIds = New-Object System.Collections.Generic.HashSet[string]

foreach ($entry in $typeMap.GetEnumerator()) {
  $fileName = $entry.Key
  $zoteroTypes = $entry.Value
  $matching = @($items | Where-Object { $_.type -in $zoteroTypes })

  foreach ($item in $matching) {
    if ($null -ne $item.id) {
      $assignedIds.Add([string]$item.id) | Out-Null
    }
  }

  $json = $matching | ConvertTo-Json -Depth 20
  Set-Content -LiteralPath (Join-Path $OutputDir $fileName) -Value $json -Encoding utf8
  Write-Host "Wrote $($matching.Count) records to $fileName"
}

$unmatched = @($items | Where-Object { $null -eq $_.id -or -not $assignedIds.Contains([string]$_.id) })

if ($unmatched.Count -gt 0) {
  Write-Warning "Some Zotero items were not mapped to a target file."
  $unmatched | Group-Object type | ForEach-Object {
    Write-Warning ("  {0}: {1}" -f $_.Name, $_.Count)
  }
}
