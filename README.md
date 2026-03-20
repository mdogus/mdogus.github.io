# mdogus.github.io

Bu repo, GitHub Pages üzerinde yayınlanacak çok dilli bir Hugo akademik kişisel site iskeletidir. Amaç; biyografi, yayınlar ve iletişim bilgilerini modern ama düşük bakım gerektiren bir yapıda sunmak, ileride projeler, öğretim, konuşmalar ve kısa notlar gibi bölümleri kolayca ekleyebilmektir.

Site iki dillidir:

- Kök dizin: Türkçe
- `en/`: English
- İlk açılışta tarayıcı / sistem dili algılanır
- Dil anahtarından yapılan seçim kaydedilir

## Kullanılan teknoloji

- [Hugo](https://gohugo.io/) statik site üreticisi
- Markdown içerik dosyaları
- Hugo `layouts`, `partials`, `i18n` ve `data` katmanları
- Tür bazlı Zotero uyumlu `data/pub-*.json` yayın dosyaları
- `data/featured-publications.json` ile ayrı seçili yayın yönetimi
- Hafif özel CSS ve minimum istemci tarafı JavaScript
- GitHub Actions ile GitHub Pages deploy akışı

## Klasör yapısı

```text
.
|-- .github/
|   `-- workflows/
|       `-- deploy.yml
|-- content/
|   |-- _index.tr.md
|   |-- _index.en.md
|   |-- about/
|   |   |-- _index.tr.md
|   |   `-- _index.en.md
|   |-- contact/
|   |   |-- _index.tr.md
|   |   `-- _index.en.md
|   `-- publications/
|       |-- _index.tr.md
|       `-- _index.en.md
|-- data/
|   |-- featured-publications.json
|   |-- pub-articles.json
|   |-- pub-books.json
|   |-- pub-conferences.json
|   `-- pub-theses.json
|-- i18n/
|   |-- en.toml
|   `-- tr.toml
|-- layouts/
|   |-- _default/
|   |   `-- baseof.html
|   |-- about/
|   |   `-- list.html
|   |-- contact/
|   |   `-- list.html
|   |-- partials/
|   `-- publications/
|       `-- list.html
|-- scripts/
|   `-- split-zotero-export.ps1
|-- static/
|   |-- css/
|   |   `-- style.css
|   |-- files/
|   |   `-- .gitkeep
|   `-- js/
|       |-- publications.js
|       `-- site-language.js
|-- hugo.toml
`-- README.md
```

## Mimari kararı

Bu repo Hugo'ya geçirildi çünkü:

- Tema ve şablon katmanı kişisel akademik site ihtiyaçları için daha esnek
- Kişisel site ve editoryal görünüm için daha uygun bir layout modeli sunuyor
- Çok dilli içerik, partial ve veri odaklı yayın mimarisi Hugo'da net biçimde ayrışıyor
- GitHub Pages deploy akışı sade ve hızlı

Yayın verileri ise Hugo geçişinden bağımsız olarak veri odaklı bırakıldı; yani yeni yayın eklemek için HTML düzenlemeniz gerekmez.

## Türkçe ve İngilizce içerik nasıl güncellenir

Sayfa metinlerini güncellemek için:

- Ana sayfa:
  - `content/_index.tr.md`
  - `content/_index.en.md`
- About:
- `content/about/_index.tr.md`
- `content/about/_index.en.md`
- Yayınlar sayfası giriş metni:
  - `content/publications/_index.tr.md`
  - `content/publications/_index.en.md`
- İletişim:
  - `content/contact/_index.tr.md`
  - `content/contact/_index.en.md`

Kural basit:

- Sayfa metni ise `content/` altında ilgili `tr` ve `en` dosyasını düzenleyin
- Yayın kaydı ise `data/` altındaki JSON dosyasını düzenleyin
- Ortak arayüz davranışı ise `layouts/`, `i18n/`, `static/js/` veya `static/css/` tarafına bakın

## Yeni yayın nasıl eklenir

Yayınlar tür bazlı dosyalarda tutulur:

- `data/pub-articles.json`
- `data/pub-books.json`
- `data/pub-conferences.json`
- `data/pub-theses.json`

En kolay güncelleme akışı:

1. Zotero'dan `JSON` export alın.
2. Export dosyasını tür bazlı dosyalara ayırmak için şu komutu çalıştırın:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\split-zotero-export.ps1 -InputPath "C:\Users\musta\Downloads\Exported Items.json"
```

3. Ana sayfada öne çıkacak yayınları ayrı dosyada tutun:

```json
[
  "http://zotero.org/users/11529521/items/8D46Q8SB",
  "http://zotero.org/users/11529521/items/6KAL7LPC"
]
```

Bu listeyi `data/featured-publications.json` içine yazın.

4. Zotero kaydının kendisi tür dosyalarında olduğu gibi kalabilir:

```json
{
  "id": "http://zotero.org/users/example/items/ABCDE123",
  "type": "article-journal",
  "title": "Yayın başlığı",
  "container-title": "Dergi / yayınevi / konferans",
  "DOI": "10.0000/example.2026.001",
  "URL": "https://example.org/publication",
  "author": [
    { "family": "Soyad", "given": "Ad" },
    { "family": "Yazar", "given": "Ortak" }
  ],
  "issued": { "date-parts": [[2026, 5, 1]] }
}
```

Ön yüz şu alanları da tanır: `authors`, `year`, `venue`, `doi`, `url`, `abstract`, `pdf`.

PDF dosyası eklerseniz `static/files/` altına koyun ve JSON içindeki `pdf` yolunu güncelleyin.

## Yeni sayfa nasıl eklenir

1. Türkçe içerik dosyasını oluşturun. Örnek: `content/teaching/_index.tr.md`
2. İngilizce karşılığını ekleyin: `content/teaching/_index.en.md`
3. Sayfa için bir şablon gerekiyorsa `layouts/teaching/list.html` ekleyin
4. Menüye almak isterseniz `hugo.toml` içindeki ilgili dil menüsünü güncelleyin

Basit bir sayfa için örnek front matter:

```yaml
---
title: "Öğretim"
eyebrow: "Öğretim"
meta: "Dersler ve akademik içerikler"
lede: "Bu sayfa dersler, seminerler ve öğretim materyalleri için kullanılabilir."
---
```

## Yerelde nasıl önizlenir

Hugo kuruluysa:

```powershell
hugo server
```

Belirli bir port ile:

```powershell
hugo server --port 4242
```

Tek seferlik üretim için:

```powershell
hugo
```

Üretilen çıktı `public/` klasörüne yazılır.

## GitHub Pages deploy akışı

Bu proje GitHub Actions ile artifact tabanlı olarak GitHub Pages'e deploy edilir.

1. GitHub reposunda **Settings > Pages** altında source olarak **GitHub Actions** seçin.
2. Kod `main` branch'ine geldiğinde `.github/workflows/deploy.yml` çalışır.
3. Workflow Hugo'yu kurar, `public/` klasörünü üretir ve GitHub Pages'e gönderir.

## Özel domain desteği

Özel domain kullanacaksanız kök dizine `static/CNAME` dosyası ekleyin. İçeriğine yalnızca domain adını yazın:

```text
example.org
```

Ayrıca `hugo.toml` içindeki `baseURL` değerini de özel domain adresinize göre güncelleyin.

## Zotero / BibTeX ile gelecekte entegrasyon

Bu sürümde yayınlar `data/pub-*.json` dosyaları üzerinden yönetilir. Ön yüzdeki normalizasyon katmanı hem sade alan adlarını hem de Zotero JSON alanlarını okuyabildiği için Zotero export akışı sürdürülebilir biçimde korunur.

İleride entegrasyon için iki pratik yol vardır:

1. Zotero'dan alınan JSON export'unu `scripts/split-zotero-export.ps1` ile doğrudan veri dosyalarına bölmek
2. Ayrı bir BibTeX kaynağından bu JSON veri modelini üreten küçük bir build adımı tanımlamak

Mevcut alanlar (`title`, `author/authors`, `issued/year`, `container-title/venue`, `DOI/doi`, `URL/url`, `pdf`, `abstract`, `type`) bu geçişi kolaylaştıracak şekilde seçilmiştir.

## Erişilebilirlik notları

Bu iskelet şu temel erişilebilirlik prensiplerini hedefler:

- Doğru belge dili
- Skip link
- Klavye ile erişilebilir menü ve dil anahtarı
- Görünür focus stilleri
- Yeterli kontrast
- Azaltılmış hareket tercihine saygı
- Anlamlı başlık hiyerarşisi
- Filtre alanlarında doğru etiket kullanımı

## Sonraki mantıklı genişlemeler

- `content/projects/`
- `content/teaching/`
- `content/talks/`
- `content/cv/`
- `content/notes/`
