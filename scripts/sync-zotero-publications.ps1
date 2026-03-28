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
$collectionKey = ""
if ($null -ne $config.collectionKey) {
  $collectionKey = [string]$config.collectionKey
} elseif ($null -ne $config.collectionId) {
  $collectionKey = [string]$config.collectionId
}
$includeSubcollections = $true
if ($null -ne $config.includeSubcollections) {
  $includeSubcollections = [bool]$config.includeSubcollections
}
$citationsCollectionName = "Citations"
if ($null -ne $config.citationsCollectionName -and -not [string]::IsNullOrWhiteSpace([string]$config.citationsCollectionName)) {
  $citationsCollectionName = [string]$config.citationsCollectionName
}
$citationsCollectionKey = ""
if ($null -ne $config.citationsCollectionKey) {
  $citationsCollectionKey = [string]$config.citationsCollectionKey
}
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

$apiRoot = "https://api.zotero.org/$libraryType/$libraryId"
$headers = @{
  "Zotero-API-Version" = "3"
  "User-Agent"         = "mdogus-github-publications-sync/1.0"
}

if (-not [string]::IsNullOrWhiteSpace($ApiKey)) {
  $headers["Zotero-API-Key"] = $ApiKey
}

$allItems = New-Object System.Collections.Generic.List[object]
$seenItemKeys = New-Object System.Collections.Generic.HashSet[string]
$itemBucketOverrides = @{}

function Normalize-CollectionName {
  param(
    [AllowNull()]
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return ""
  }

  return $Value.Trim().ToLowerInvariant()
}

function Get-OptionalPropertyValue {
  param(
    [Parameter(Mandatory = $true)]
    [object]$Object,

    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  $property = $Object.PSObject.Properties[$Name]

  if ($null -eq $property) {
    return $null
  }

  return $property.Value
}

function Repair-MojibakeText {
  param(
    [AllowNull()]
    [string]$Value
  )

  if ([string]::IsNullOrEmpty($Value)) {
    return $Value
  }

  try {
    $sourceEncoding = [System.Text.Encoding]::GetEncoding(1252)
    $bytes = $sourceEncoding.GetBytes($Value)
    $decoded = [System.Text.Encoding]::UTF8.GetString($bytes)

    if ([string]::IsNullOrWhiteSpace($decoded)) {
      return $Value
    }

    $suspectChars = @([char]0x00C3, [char]0x00C4, [char]0x00C5, [char]0x00C2, [char]0x00E2)
    $originalPenalty = 0
    $decodedPenalty = 0

    foreach ($character in $suspectChars) {
      $originalPenalty += ([regex]::Matches($Value, [regex]::Escape([string]$character))).Count
      $decodedPenalty += ([regex]::Matches($decoded, [regex]::Escape([string]$character))).Count
    }

    if ($decodedPenalty -lt $originalPenalty) {
      return $decoded
    }

    return $Value
  } catch {
    return $Value
  }
}

function Normalize-TextValue {
  param(
    [AllowNull()]
    [object]$Value
  )

  if ($null -eq $Value) {
    return ""
  }

  return [string](Repair-MojibakeText -Value ([string]$Value))
}

function Invoke-ZoteroJsonRequest {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url
  )

  $client = New-Object System.Net.WebClient

  try {
    foreach ($headerName in $headers.Keys) {
      $client.Headers.Add($headerName, [string]$headers[$headerName])
    }

    $bytes = $client.DownloadData($Url)
    $content = [System.Text.Encoding]::UTF8.GetString($bytes)

    if ([string]::IsNullOrWhiteSpace($content)) {
      return $null
    }

    return $content | ConvertFrom-Json
  } catch {
    $message = $_.Exception.Message
    if ($message -match '\(403\)' -or $message -match '403') {
      throw "Zotero API returned 403 Forbidden. This library likely requires a valid API key."
    }
    throw
  } finally {
    $client.Dispose()
  }
}

function Invoke-ZoteroPagedRequest {
  param(
    [Parameter(Mandatory = $true)]
    [string]$BaseUrl
  )

  $results = New-Object System.Collections.Generic.List[object]
  $start = 0

  do {
    $url = "${BaseUrl}?format=json&include=data&limit=$pageSize&start=$start"
    $response = Invoke-ZoteroJsonRequest -Url $url

    $batch = @($response)

    foreach ($entry in $batch) {
      $results.Add($entry) | Out-Null
    }

    $start += $batch.Count
  } while ($batch.Count -eq $pageSize)

  return $results.ToArray()
}

function Get-ZoteroCollectionMetadata {
  param(
    [Parameter(Mandatory = $true)]
    [string]$CollectionKey
  )

  $url = "$apiRoot/collections/${CollectionKey}?format=json&include=data"
  return Invoke-ZoteroJsonRequest -Url $url
}

function Get-ZoteroCollections {
  param(
    [Parameter(Mandatory = $true)]
    [string]$RootCollectionKey
  )

  $collections = New-Object System.Collections.ArrayList
  $queue = New-Object System.Collections.ArrayList
  $seenCollections = New-Object System.Collections.Generic.HashSet[string]
  $rootMetadata = Get-ZoteroCollectionMetadata -CollectionKey $RootCollectionKey
  $rootName = Normalize-TextValue (Get-OptionalPropertyValue -Object $rootMetadata.data -Name "name")
  [void]$queue.Add([pscustomobject]@{
    Key  = $RootCollectionKey
    Name = $rootName
    Path = @($rootName)
  })

  while ($queue.Count -gt 0) {
    $current = $queue[0]
    $queue.RemoveAt(0)
    $currentKey = [string]$current.Key

    if (-not $seenCollections.Add($currentKey)) {
      continue
    }

    [void]$collections.Add($current)

    if (-not $includeSubcollections) {
      continue
    }

    $subcollectionUrl = "$apiRoot/collections/$currentKey/collections"
    $subcollections = @(Invoke-ZoteroPagedRequest -BaseUrl ([string]$subcollectionUrl))

    foreach ($subcollection in $subcollections) {
      if ($subcollection.key) {
        $subName = Normalize-TextValue (Get-OptionalPropertyValue -Object $subcollection.data -Name "name")
        $pathSegments = @($current.Path) + @($subName)
        [void]$queue.Add([pscustomobject]@{
          Key  = [string]$subcollection.key
          Name = $subName
          Path = $pathSegments
        })
      }
    }
  }

  return @($collections.ToArray())
}

function Test-IsCitationCollection {
  param(
    [Parameter(Mandatory = $true)]
    [object]$Collection
  )

  $currentCollectionKey = [string]$Collection.Key

  if (-not [string]::IsNullOrWhiteSpace($citationsCollectionKey) -and $currentCollectionKey -eq $citationsCollectionKey) {
    return $true
  }

  $normalizedTarget = Normalize-CollectionName -Value $citationsCollectionName

  if ([string]::IsNullOrWhiteSpace($normalizedTarget)) {
    return $false
  }

  foreach ($segment in @($Collection.Path)) {
    if ((Normalize-CollectionName -Value ([string]$segment)) -eq $normalizedTarget) {
      return $true
    }
  }

  return $false
}

function Resolve-PublicationBucket {
  param(
    [Parameter(Mandatory = $true)]
    [object]$Item
  )

  $itemType = [string](Get-OptionalPropertyValue -Object $Item -Name "itemType")
  $publicationTitle = Get-OptionalPropertyValue -Object $Item -Name "publicationTitle"
  $bookTitle = Get-OptionalPropertyValue -Object $Item -Name "bookTitle"
  $proceedingsTitle = Get-OptionalPropertyValue -Object $Item -Name "proceedingsTitle"
  $conferenceName = Get-OptionalPropertyValue -Object $Item -Name "conferenceName"
  $thesisType = Get-OptionalPropertyValue -Object $Item -Name "thesisType"
  $institution = Get-OptionalPropertyValue -Object $Item -Name "institution"
  $university = Get-OptionalPropertyValue -Object $Item -Name "university"

  switch ($itemType) {
    "journalArticle" { return "article" }
    "magazineArticle" { return "article" }
    "newspaperArticle" { return "article" }
    "book" { return "book" }
    "bookSection" { return "book" }
    "encyclopediaArticle" { return "book" }
    "dictionaryEntry" { return "book" }
    "conferencePaper" { return "conference" }
    "presentation" { return "conference" }
    "speech" { return "conference" }
    "thesis" { return "thesis" }
  }

  if ($publicationTitle) {
    return "article"
  }

  if ($conferenceName -or $proceedingsTitle) {
    return "conference"
  }

  if ($thesisType -or $institution -or $university) {
    return "thesis"
  }

  if ($bookTitle -or $itemType -match "book|encyclopedia|dictionary") {
    return "book"
  }

  return $null
}

if (-not [string]::IsNullOrWhiteSpace($collectionKey)) {
  $collections = Get-ZoteroCollections -RootCollectionKey $collectionKey

  foreach ($collection in $collections) {
    $currentCollectionKey = [string]$collection.Key
    $itemsUrl = "$apiRoot/collections/$currentCollectionKey/items"
    $batch = @(Invoke-ZoteroPagedRequest -BaseUrl ([string]$itemsUrl))
    $isCitationCollection = Test-IsCitationCollection -Collection $collection

    foreach ($entry in $batch) {
      $entryKey = [string]$entry.key

      if ($seenItemKeys.Add($entryKey)) {
        $allItems.Add($entry) | Out-Null
      }

      if ($isCitationCollection) {
        $itemBucketOverrides[$entryKey] = "citation"
      }
    }
  }

  Write-Host "Synced Zotero collection: $collectionKey"
  if ($includeSubcollections) {
    Write-Host "Included subcollections: $($collections.Count - 1)"
  }
} else {
  $libraryItemsUrl = "$apiRoot/items"
  $batch = @(Invoke-ZoteroPagedRequest -BaseUrl ([string]$libraryItemsUrl))

  foreach ($entry in $batch) {
    if ($seenItemKeys.Add([string]$entry.key)) {
      $allItems.Add($entry) | Out-Null
    }
  }

  Write-Host "Synced all Zotero items in library: $libraryId"
}

$mapped = foreach ($entry in $allItems) {
  $item = $entry.data

  if ($null -eq $item) {
    continue
  }

  $itemTypeValue = [string](Get-OptionalPropertyValue -Object $item -Name "itemType")

  if ($itemTypeValue -in @("attachment", "note", "annotation")) {
    continue
  }

  $creatorsSource = Get-OptionalPropertyValue -Object $item -Name "creators"

  $creators = @(
    foreach ($creator in @($creatorsSource)) {
      if (-not $creator) {
        continue
      }

      $creatorNameProperty = $creator.PSObject.Properties["name"]
      $firstNameProperty = $creator.PSObject.Properties["firstName"]
      $lastNameProperty = $creator.PSObject.Properties["lastName"]
      $creatorName = if ($null -ne $creatorNameProperty) { Normalize-TextValue $creatorNameProperty.Value } else { $null }
      $firstName = if ($null -ne $firstNameProperty) { Normalize-TextValue $firstNameProperty.Value } else { $null }
      $lastName = if ($null -ne $lastNameProperty) { Normalize-TextValue $lastNameProperty.Value } else { $null }

      if ($creatorName) {
        [ordered]@{
          literal = [string]$creatorName
        }
        continue
      }

      [ordered]@{
        given  = [string]$firstName
        family = [string]$lastName
      }
    }
  )

  $dateValue = [string](Get-OptionalPropertyValue -Object $item -Name "date")

  $record = [ordered]@{
    id     = "http://zotero.org/$libraryType/$libraryId/items/$($entry.key)"
    type   = if ($itemBucketOverrides.ContainsKey([string]$entry.key)) { $itemBucketOverrides[[string]$entry.key] } else { Resolve-PublicationBucket -Item $item }
    itemType = $itemTypeValue
    title  = Normalize-TextValue (Get-OptionalPropertyValue -Object $item -Name "title")
    author = $creators
    DOI    = Normalize-TextValue (Get-OptionalPropertyValue -Object $item -Name "DOI")
    URL    = Normalize-TextValue (Get-OptionalPropertyValue -Object $item -Name "url")
    abstract = Normalize-TextValue (Get-OptionalPropertyValue -Object $item -Name "abstractNote")
    date   = $dateValue
    year   = if ($dateValue -match '\d{4}') { [int]$Matches[0] } else { $null }
    publisher = Normalize-TextValue (Get-OptionalPropertyValue -Object $item -Name "publisher")
    issue  = Normalize-TextValue (Get-OptionalPropertyValue -Object $item -Name "issue")
    page   = Normalize-TextValue (Get-OptionalPropertyValue -Object $item -Name "pages")
    volume = Normalize-TextValue (Get-OptionalPropertyValue -Object $item -Name "volume")
    genre  = Normalize-TextValue (Get-OptionalPropertyValue -Object $item -Name "thesisType")
    institution = Normalize-TextValue (Get-OptionalPropertyValue -Object $item -Name "institution")
    university = Normalize-TextValue (Get-OptionalPropertyValue -Object $item -Name "university")
  }

  $publicationTitle = Get-OptionalPropertyValue -Object $item -Name "publicationTitle"
  $bookTitle = Get-OptionalPropertyValue -Object $item -Name "bookTitle"
  $proceedingsTitle = Get-OptionalPropertyValue -Object $item -Name "proceedingsTitle"
  $conferenceName = Get-OptionalPropertyValue -Object $item -Name "conferenceName"

  if ($publicationTitle) {
    $record["container-title"] = Normalize-TextValue $publicationTitle
  }

  if ($bookTitle -and -not $record.Contains("container-title")) {
    $record["container-title"] = Normalize-TextValue $bookTitle
  }

  if ($proceedingsTitle -and -not $record.Contains("container-title")) {
    $record["container-title"] = Normalize-TextValue $proceedingsTitle
  }

  if ($conferenceName) {
    $record["event-title"] = Normalize-TextValue $conferenceName
  }

  [pscustomobject]$record
}

$typeMap = @{
  "pub-articles.json"    = "article"
  "pub-books.json"       = "book"
  "pub-conferences.json" = "conference"
  "pub-theses.json"      = "thesis"
  "pub-citations.json"   = "citation"
}

$assignedIds = New-Object System.Collections.Generic.HashSet[string]

foreach ($entry in $typeMap.GetEnumerator()) {
  $fileName = $entry.Key
  $bucket = $entry.Value
  $matching = @($mapped | Where-Object { $_.type -eq $bucket })

  foreach ($item in $matching) {
    if ($null -ne $item.id) {
      $assignedIds.Add([string]$item.id) | Out-Null
    }
  }

  $json = $matching | ConvertTo-Json -Depth 20
  $outputPath = Join-Path $OutputDir $fileName
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($outputPath, $json, $utf8NoBom)
  Write-Host "Wrote $($matching.Count) records to $fileName"
}

$unmatched = @($mapped | Where-Object { $null -eq $_.id -or -not $assignedIds.Contains([string]$_.id) })

if ($unmatched.Count -gt 0) {
  Write-Warning "Some Zotero items were not mapped to a target file."
  $unmatched | Group-Object itemType | ForEach-Object {
    Write-Warning ("  {0}: {1}" -f $_.Name, $_.Count)
  }
}
