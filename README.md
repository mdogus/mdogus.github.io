# mdogus.github.io

Mustafa Doğuş'un kişisel akademik web sitesinin kaynak kodu.

## İçerik nereden güncellenir?

- Ana sayfa: `content/_index.tr.md`, `content/_index.en.md`
- Hakkında: `content/about/_index.tr.md`, `content/about/_index.en.md`
- Yayınlar sayfası metni: `content/publications/_index.tr.md`, `content/publications/_index.en.md`
- İletişim: `content/contact/_index.tr.md`, `content/contact/_index.en.md`
- Menü ve genel ayarlar: `hugo.toml`
- Tasarım ve düzen: `layouts/` ve `static/css/style.css`

## Yayınlar

Yayın verileri `data/` altında tutulur:

- `data/pub-articles.json`
- `data/pub-books.json`
- `data/pub-conferences.json`
- `data/pub-theses.json`
- `data/featured-publications.json`

Zotero export'unu parçalamak için:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\split-zotero-export.ps1 -InputPath "C:\Users\musta\Downloads\Exported Items.json"
```

## Yapı

- `content/` sayfa içerikleri
- `layouts/` Hugo şablonları
- `static/` CSS, JS ve görseller
- `data/` yayın verileri
- `.github/workflows/deploy.yml` GitHub Pages deploy akışı

## Not

- Kök dizin Türkçe, `en/` İngilizce içeriktir.
- Bu repo doğrudan kişisel siteyi besler; genel amaçlı tema paketi değildir.
- `public/` build çıktısıdır.
