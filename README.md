# mdogus.github.io

Bu proje, GitHub Pages uzerinde yayinlanacak, Quarto tabanli, erisilebilir ve dusuk bakimli bir akademik kisisel web sitesi iskeletidir.
Amac; biyografi, yayinlar ve iletisim bilgilerini temiz bir bilgi mimarisi icinde sunmak, ileride projeler, ogretim, konusmalar ve duyurular gibi yeni bolumleri kolayca ekleyebilmektir.

Site su an iki dilli calisir:

- Kök dizin: Turkce
- `en/`: English
- Ilk acilista tarayici / sistem dili algilanir
- Navbar dil anahtari ile kullanici tercihi kaydedilir

## Kullanilan teknoloji

- [Quarto](https://quarto.org/) website yapisi
- Markdown ve `qmd` sayfalari
- Veri odakli yayin listesi icin tur bazli `data/pub-*.json` dosyalari
- TR kök sayfalar ve `en/` altinda English sayfalar
- Otomatik dil yonlendirmesi ve kalici dil secimi icin `assets/js/site-language.js`
- Hafif, bagimsizlik sayisi dusuk bir stil katmani
- GitHub Actions ile GitHub Pages deploy akisi

## Klasor yapisi

```text
.
|-- .github/
|   `-- workflows/
|       `-- deploy.yml
|-- assets/
|   |-- files/
|   `-- js/
|       |-- publications.js
|       `-- site-language.js
|-- data/
|   |-- featured-publications.json
|   |-- pub-articles.json
|   |-- pub-books.json
|   |-- pub-conferences.json
|   `-- pub-theses.json
|-- en/
|   |-- 404.qmd
|   |-- bio.qmd
|   |-- contact.qmd
|   |-- index.qmd
|   `-- publications.qmd
|-- includes/
|   |-- head-meta.html
|   |-- site-footer.html
|   `-- skip-link.html
|-- scripts/
|   `-- split-zotero-export.ps1
|-- 404.qmd
|-- _quarto.yml
|-- bio.qmd
|-- contact.qmd
|-- index.qmd
|-- publications.qmd
|-- styles.scss
`-- README.md
```

## Mimari karari

Bu repo icin Quarto tercih edildi cunku:

- Icerik dosyalarini HTML'den ayirir ve bakimi kolaylastirir.
- GitHub Pages ile iyi calisir.
- Yeni sayfa eklemeyi basitlestirir.
- Tek tek HTML dosyasi buyutmek yerine uzun omurlu bir website mimarisi sunar.
- Markdown tabanli icerik yonetimi akademik is akisina uygundur.

Yerel ortamda Quarto su an kurulu degilse bile bu yapi yine dogru secimdir; render islemi GitHub Actions uzerinde yapilir. Yerelde onizleme icin yalnizca Quarto kurulumu gerekir.

## Yeni yayin nasil eklenir

Bu surumde yayinlar tur bazli dosyalarda tutulur:

- `data/pub-articles.json`
- `data/pub-books.json`
- `data/pub-conferences.json`
- `data/pub-theses.json`

En kolay guncelleme akisi:

1. Zotero'dan `JSON` export alin.
2. Export dosyasini tur bazli dosyalara ayirmak icin su komutu calistirin:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\split-zotero-export.ps1 -InputPath "C:\Users\musta\Downloads\Exported Items.json"
```

3. Ana sayfada one cikacak yayinlari ayri bir dosyada tutun:

```json
[
  "http://zotero.org/users/11529521/items/8D46Q8SB",
  "http://zotero.org/users/11529521/items/6KAL7LPC"
]
```

Bu listeyi `data/featured-publications.json` icine yazin.

4. Zotero kaydinin kendisi ise tur dosyalarinda oldugu gibi kalsin:

```json
{
  "id": "http://zotero.org/users/example/items/ABCDE123",
  "type": "article-journal",
  "title": "Yayin basligi",
  "container-title": "Dergi / yayin evi / konferans",
  "DOI": "10.0000/example.2026.001",
  "URL": "https://example.org/publication",
  "author": [
    { "family": "Soyad", "given": "Ad" },
    { "family": "Yazar", "given": "Ortak" }
  ],
  "issued": { "date-parts": [[2026, 5, 1]] }
}
```

Alternatif olarak dosyalari elle de guncelleyebilirsiniz. Site su alanlari da tanir:
`authors`, `year`, `venue`, `doi`, `url`, `abstract`, `pdf`.
PDF dosyasi varsa `assets/files/` altina koyun ve `pdf` yolunu guncelleyin.

## Yeni sayfa nasil eklenir

1. Koke yeni bir Turkce `qmd` dosyasi ekleyin. Ornek: `teaching.qmd`
2. On kisma uygun front matter ekleyin:

```yaml
---
title: "Ogretim"
description: "Dersler ve ogrenci calismalari."
---
```

3. Ayni sayfanin English surumunu `en/teaching.qmd` olarak ekleyin.
4. Gerekirse `styles.scss` icinde sayfaya ozel siniflar ekleyin.
5. Yeni sayfa navbar'da yer alacaksa `assets/js/site-language.js` icindeki `PATHS` ve `nav` eslemelerini guncelleyin.

## Yerelde nasil onizlenir

Quarto kurulduktan sonra:

```powershell
quarto preview
```

Tek seferlik cikti almak icin:

```powershell
quarto render
```

Ilk acilista site tarayici diline gore TR veya EN surume gider. Dil anahtarindan yapilan secim
`localStorage` icinde tutulur ve sonraki ziyaretlerde korunur.

## GitHub Pages deploy akisi

Bu proje, GitHub Actions ile render edilip GitHub Pages'e artifact tabanli olarak deploy edilir.

1. GitHub reposunda **Settings > Pages** altinda source olarak **GitHub Actions** secin.
2. Kod `main` branch'ine geldigi anda `.github/workflows/deploy.yml` calisir.
3. Workflow Quarto'yu kurar, siteyi `_site/` klasorune render eder ve GitHub Pages'e gonderir.

## Ozel domain destegi

Ozel domain kullanacaksaniz kok dizine `CNAME` dosyasi ekleyin. Icerigine yalnizca domain adini yazin:

```text
example.org
```

`_quarto.yml` dosyasindaki `site-url` alanini da o domaine gore guncelleyin.

## Zotero / BibTeX ile gelecekte entegrasyon

Bu surumde yayinlar `data/pub-*.json` dosyalari uzerinden yonetilir. On yuz tarafindaki
normalizasyon katmani hem sade alan adlarini hem de Zotero JSON alanlarini okuyabildigi icin
tur bazli ayiklama kolayca surdurulur. Ana sayfadaki secili yayinlar ise ayri olarak
`data/featured-publications.json` dosyasinda tutulur.

Ileride Zotero veya BibTeX ile entegrasyon icin iki pratik yol vardir:

1. Zotero'dan alinan JSON export'u `scripts/split-zotero-export.ps1` ile dogrudan veri dosyalarina bolmek
2. Ayrica `references.bib` dosyasi tutup, JSON veri modelini bu bibliyografiden ureten bir build adimi tanimlamak

Mevcut alanlar (`title`, `author/authors`, `issued/year`, `container-title/venue`, `DOI/doi`, `URL/url`, `pdf`, `abstract`, `type`) bu gecisi kolaylastiracak sekilde secilmistir.

## Erisilebilirlik notlari

Bu iskelet asagidaki temel erisilebilirlik prensiplerini hedefler:

- Dogru `lang` tanimi
- Skip link
- TR ve EN sayfalarda dogru belge dili
- Anlamli baslik hiyerarsisi
- Klavye ile gezilebilir filtreler ve linkler
- Klavye ile kullanilabilir dil anahtari
- Gorunur focus stilleri
- Yeterli kontrast
- Hareket azaltilmis tercihine saygi
- Anlamli link metinleri

## Sonraki mantikli genislemeler

- `projects.qmd`
- `teaching.qmd`
- `talks.qmd`
- `cv.qmd`
- `notes/` veya `announcements/` klasoru
