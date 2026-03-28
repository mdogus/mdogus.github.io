param(
  [string]$ConfigPath = "zotero-sync.json",
  [string]$OutputDir = "data",
  [string]$ApiKey = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ConfigPath)) {
  throw "Zotero sync config not found: $ConfigPath"
}

$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
$libraryType = [string]$config.libraryType
$libraryId = [string]$config.libraryId
$pageSize = if ($config.pageSize) { [int]$config.pageSize } else { 100 }
$requiresApiKey = [bool]$config.requiresApiKey

if ([string]::IsNullOrWhiteSpace($libraryType) -or [string]::IsNullOrWhiteSpace($libraryId)) {
  throw "zotero-sync.json must include libraryType and libraryId."
}

if ($pageSize -lt 1 -or $pageSize -gt 100) {
  throw "pageSize must be between 1 and 100."
}

if ($requiresApiKey -and [string]::IsNullOrWhiteSpace($ApiKey)) {
  throw "This Zotero library requires an API key. Provide -ApiKey or set the ZOTERO_API_KEY secret in GitHub."
}

if (-not (Test-Path -LiteralPath $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$baseUrl = "https://api.zotero.org/$libraryType/$libraryId/items"
$headers = @{
  "Zotero-API-Version" = "3"
  "User-Agent"         = "mdogus-github-publications-sync/1.0"
}

if (-not [string]::IsNullOrWhiteSpace($ApiKey)) {
  $headers["Zotero-API-Key"] = $ApiKey
}

$allItems = New-Object System.Collections.Generic.List[object]
$start = 0

do {
  $url = "${baseUrl}?format=json&include=data&limit=$pageSize&start=$start"
  try {
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
  } catch {
    $message = $_.Exception.Message
    if ($message -match '\(403\)') {
      throw "Zotero API returned 403 Forbidden. This library likely requires a valid API key."
    }
    throw
  }
  $batch = @($response)

  foreach ($entry in $batch) {
    $allItems.Add($entry) | Out-Null
  }

  $start += $batch.Count
} while ($batch.Count -eq $pageSize)

$mapped = foreach ($entry in $allItems) {
  $item = $entry.data

  if ($null -eq $item) {
    continue
  }

  $creators = @(
    foreach ($creator in @($item.creators)) {
      if (-not $creator) {
        continue
      }

      if ($creator.name) {
        [ordered]@{
          literal = [string]$creator.name
        }
        continue
      }

      [ordered]@{
        given  = [string]$creator.firstName
        family = [string]$creator.lastName
      }
    }
  )

  $record = [ordered]@{
    id     = "http://zotero.org/$libraryType/$libraryId/items/$($entry.key)"
    type   = [string]$item.itemType
    title  = [string]$item.title
    author = $creators
    DOI    = [string]$item.DOI
    URL    = [string]$item.url
    abstract = [string]$item.abstractNote
    date   = [string]$item.date
    year   = if ($item.date -match '\d{4}') { [int]$Matches[0] } else { $null }
    publisher = [string]$item.publisher
    issue  = [string]$item.issue
    page   = [string]$item.pages
    volume = [string]$item.volume
    genre  = [string]$item.thesisType
    institution = [string]$item.institution
    university = [string]$item.university
  }

  if ($item.publicationTitle) {
    $record["container-title"] = [string]$item.publicationTitle
  }

  if ($item.bookTitle -and -not $record.Contains("container-title")) {
    $record["container-title"] = [string]$item.bookTitle
  }

  if ($item.proceedingsTitle -and -not $record.Contains("container-title")) {
    $record["container-title"] = [string]$item.proceedingsTitle
  }

  if ($item.conferenceName) {
    $record["event-title"] = [string]$item.conferenceName
  }

  [pscustomobject]$record
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
  $matching = @($mapped | Where-Object { $_.type -in $zoteroTypes })

  foreach ($item in $matching) {
    if ($null -ne $item.id) {
      $assignedIds.Add([string]$item.id) | Out-Null
    }
  }

  $json = $matching | ConvertTo-Json -Depth 20
  Set-Content -LiteralPath (Join-Path $OutputDir $fileName) -Value $json -Encoding utf8
  Write-Host "Wrote $($matching.Count) records to $fileName"
}

$unmatched = @($mapped | Where-Object { $null -eq $_.id -or -not $assignedIds.Contains([string]$_.id) })

if ($unmatched.Count -gt 0) {
  Write-Warning "Some Zotero items were not mapped to a target file."
  $unmatched | Group-Object type | ForEach-Object {
    Write-Warning ("  {0}: {1}" -f $_.Name, $_.Count)
  }
}
