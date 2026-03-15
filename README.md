# mdogus.github.io

Bu proje, GitHub Pages uzerinde yayinlanacak, Quarto tabanli, erisilebilir ve dusuk bakimli bir akademik kisisel web sitesi iskeletidir.
Amac; biyografi, yayinlar ve iletisim bilgilerini temiz bir bilgi mimarisi icinde sunmak, ileride projeler, ogretim, konusmalar ve duyurular gibi yeni bolumleri kolayca ekleyebilmektir.

## Kullanilan teknoloji

- [Quarto](https://quarto.org/) website yapisi
- Markdown ve `qmd` sayfalari
- Veri odakli yayin listesi icin `data/publications.json`
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
|       `-- publications.js
|-- data/
|   `-- publications.json
|-- includes/
|   |-- head-meta.html
|   `-- skip-link.html
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

1. `data/publications.json` dosyasini acin.
2. Asagidaki alanlari kullanarak yeni bir nesne ekleyin:

```json
{
  "id": "article-2026-example",
  "title": "Yayin basligi",
  "authors": ["Ad Soyad", "Ortak Yazar"],
  "year": 2026,
  "venue": "Dergi / yayin evi / konferans",
  "type": "article",
  "doi": "10.0000/example.2026.001",
  "url": "https://example.org/publication",
  "pdf": "assets/files/example.pdf",
  "abstract": "Kisa aciklama veya ozet.",
  "featured": false
}
```

3. `type` alanini su degerlerden biri ile verin:
   `article`, `book`, `conference`, `thesis`
4. Ana sayfada one cikan yayin olarak gostermek icin `featured: true` kullanin.
5. PDF dosyasi varsa `assets/files/` altina koyun ve `pdf` yolunu guncelleyin.

## Yeni sayfa nasil eklenir

1. Koke yeni bir `qmd` dosyasi ekleyin. Ornek: `teaching.qmd`
2. On kisma uygun front matter ekleyin:

```yaml
---
title: "Ogretim"
description: "Dersler ve ogrenci calismalari."
---
```

3. Sayfayi `_quarto.yml` icindeki `website.navbar.left` listesine ekleyin.
4. Gerekirse `styles.scss` icinde sayfaya ozel siniflar ekleyin.

## Yerelde nasil onizlenir

Quarto kurulduktan sonra:

```powershell
quarto preview
```

Tek seferlik cikti almak icin:

```powershell
quarto render
```

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

Bu surumde yayinlar `data/publications.json` uzerinden yonetilir; cunku kategoriye gore ayiklama,
one cikan yayin secimi ve istemci tarafinda filtreleme icin sade bir veri yapisi sunar.

Ileride Zotero veya BibTeX ile entegrasyon icin iki pratik yol vardir:

1. Zotero'dan BibTeX export alip bunu `publications.json` formatina donusturen kucuk bir donusum scripti eklemek
2. Ayrica `references.bib` dosyasi tutup, JSON veri modelini bu bibliyografiden ureten bir build adimi tanimlamak

Mevcut alanlar (`title`, `authors`, `year`, `venue`, `doi`, `url`, `pdf`, `abstract`, `type`) bu gecisi kolaylastiracak sekilde secilmistir.

## Erisilebilirlik notlari

Bu iskelet asagidaki temel erisilebilirlik prensiplerini hedefler:

- Dogru `lang` tanimi
- Skip link
- Anlamli baslik hiyerarsisi
- Klavye ile gezilebilir filtreler ve linkler
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
