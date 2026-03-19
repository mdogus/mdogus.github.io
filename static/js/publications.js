(function () {
  const locale = document.documentElement.lang.toLowerCase().startsWith("tr") ? "tr" : "en";

  const copy = {
    tr: {
      labels: {
        article: "Makaleler",
        book: "Kitaplar",
        conference: "Bildiriler",
        thesis: "Tezler",
        publication: "Yayın",
      },
      noFeaturedData: "Öne çıkan yayın verisi bulunamadı.",
      noPublicationData: "Yayın kaydı bulunamadı.",
      noFeaturedSelection: "Henüz öne çıkan yayın seçilmedi.",
      listedCount: (count) => `${count} yayın listeleniyor.`,
      noFilteredResults: "Seçili filtrelerle eşleşen yayın bulunamadı.",
      doiLabel: "DOI",
      urlLabel: "Bağlantı",
      pdfLabel: "PDF",
      abstractLabel: "Özet",
      abstractMore: "Devamını gör",
      abstractLess: "Daha az göster",
    },
    en: {
      labels: {
        article: "Articles",
        book: "Books",
        conference: "Conference Papers",
        thesis: "Theses",
        publication: "Publication",
      },
      noFeaturedData: "No featured publication data was found.",
      noPublicationData: "No publication records were found.",
      noFeaturedSelection: "No featured publications have been selected yet.",
      listedCount: (count) => `${count} publications listed.`,
      noFilteredResults: "No publications match the selected filters.",
      doiLabel: "DOI",
      urlLabel: "Link",
      pdfLabel: "PDF",
      abstractLabel: "Abstract",
      abstractMore: "Read more",
      abstractLess: "Show less",
    },
  }[locale];

  const typeMap = {
    article: "article",
    "article-journal": "article",
    "article-magazine": "article",
    "article-newspaper": "article",
    book: "book",
    chapter: "book",
    "entry-encyclopedia": "book",
    "entry-dictionary": "book",
    conference: "conference",
    "paper-conference": "conference",
    presentation: "conference",
    speech: "conference",
    thesis: "thesis",
    dissertation: "thesis",
  };

  const abstractPreviewLength = 240;

  document.addEventListener("DOMContentLoaded", () => {
    const publications = readPublications();
    const featuredIds = readFeaturedPublicationIds();

    if (!publications.length) {
      renderEmptyState(document.getElementById("featured-publications"), copy.noFeaturedData);
      renderEmptyState(document.getElementById("publications-directory"), copy.noPublicationData);
      return;
    }

    initFeaturedPublications(publications, featuredIds);
    initPublicationDirectory(publications);
  });

  function readScriptJson(id) {
    if (id === "publications-data" && Array.isArray(window.__PUBLICATIONS_DATA__)) {
      return window.__PUBLICATIONS_DATA__;
    }

    if (id === "featured-publications-data" && Array.isArray(window.__FEATURED_PUBLICATIONS_DATA__)) {
      return window.__FEATURED_PUBLICATIONS_DATA__;
    }

    const source = document.getElementById(id);

    if (!source) {
      return null;
    }

    try {
      return JSON.parse(source.textContent);
    } catch (error) {
      console.error(`Could not parse ${id}.`, error);
      return null;
    }
  }

  function readPublications() {
    const parsed = readScriptJson("publications-data");

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => normalizePublication(item))
      .filter((item) => item.title && item.year && item.type)
      .sort(comparePublications);
  }

  function readFeaturedPublicationIds() {
    const parsed = readScriptJson("featured-publications-data");

    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(
      parsed
        .map((item) => String(item || "").trim())
        .filter(Boolean),
    );
  }

  function normalizePublication(item) {
    const type = normalizeType(item.type || item.itemType);

    return {
      id: item.id || buildPublicationId(item.title, type, extractYear(item)),
      title: item.title || "",
      authors: normalizeAuthors(item.authors || item.author),
      year: extractYear(item),
      venue: normalizeVenue(item, type),
      type,
      doi: normalizeDoi(item.doi || item.DOI),
      url: item.url || item.URL || "",
      pdf: item.pdf || "",
      abstract: item.abstract || item.abstractNote || "",
      featured: Boolean(item.featured),
    };
  }

  function normalizeType(rawType) {
    return typeMap[rawType] || "article";
  }

  function normalizeAuthors(authors) {
    if (!authors) {
      return [];
    }

    if (!Array.isArray(authors)) {
      return [String(authors)].filter(Boolean);
    }

    return authors
      .map((author) => {
        if (typeof author === "string") {
          return author;
        }

        if (author.literal) {
          return author.literal;
        }

        return [author.given, author.family].filter(Boolean).join(" ").trim();
      })
      .filter(Boolean);
  }

  function extractYear(item) {
    if (item.year) {
      return Number(item.year) || 0;
    }

    const issuedYear = item.issued?.["date-parts"]?.[0]?.[0];

    if (issuedYear) {
      return Number(issuedYear) || 0;
    }

    const dateCandidate = item.date || item.accessed?.["date-parts"]?.[0]?.[0];
    const yearMatch = String(dateCandidate || "").match(/\d{4}/);
    return yearMatch ? Number(yearMatch[0]) : 0;
  }

  function normalizeVenue(item, type) {
    const candidates = [
      item.venue,
      item["container-title"],
      item["event-title"],
      item.publisher,
      item.institution,
      item.university,
      item["collection-title"],
    ];

    const venue = candidates.find((value) => typeof value === "string" && value.trim());

    if (venue) {
      return venue.trim();
    }

    if (type === "thesis" && item.genre) {
      return item.genre;
    }

    return "";
  }

  function normalizeDoi(value) {
    if (!value) {
      return "";
    }

    return String(value)
      .trim()
      .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
      .replace(/^doi:\s*/i, "");
  }

  function buildPublicationId(title, type, year) {
    const slug = String(title || "publication")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);

    return [type, year || "undated", slug].filter(Boolean).join("-");
  }

  function comparePublications(left, right) {
    if (left.year !== right.year) {
      return right.year - left.year;
    }

    return left.title.localeCompare(right.title, locale);
  }

  function initFeaturedPublications(publications, featuredIds) {
    const container = document.getElementById("featured-publications");

    if (!container) {
      return;
    }

    const featuredItems = publications
      .filter((item) => featuredIds.has(String(item.id)) || item.featured)
      .slice(0, 3);

    if (!featuredItems.length) {
      renderEmptyState(container, copy.noFeaturedSelection);
      return;
    }

    container.replaceChildren(buildPublicationList(featuredItems, {
      includeTypeBadge: false,
      variant: "featured",
    }));
  }

  function initPublicationDirectory(publications) {
    const container = document.getElementById("publications-directory");
    const categoryFilter = document.getElementById("category-filter");
    const yearFilter = document.getElementById("year-filter");
    const feedback = document.getElementById("publication-feedback");

    if (!container || !categoryFilter || !yearFilter || !feedback) {
      return;
    }

    populateYearFilter(yearFilter, publications);

    const render = () => {
      const selectedCategory = categoryFilter.value;
      const selectedYear = yearFilter.value;

      const filtered = publications.filter((item) => {
        const categoryMatch = selectedCategory === "all" || item.type === selectedCategory;
        const yearMatch = selectedYear === "all" || String(item.year) === selectedYear;
        return categoryMatch && yearMatch;
      });

      feedback.textContent = copy.listedCount(filtered.length);
      renderGroupedPublications(container, filtered, selectedCategory);
    };

    categoryFilter.addEventListener("change", render);
    yearFilter.addEventListener("change", render);
    render();
  }

  function populateYearFilter(yearFilter, publications) {
    const years = [...new Set(publications.map((item) => item.year))]
      .filter(Boolean)
      .sort((left, right) => right - left);

    years.forEach((year) => {
      const option = document.createElement("option");
      option.value = String(year);
      option.textContent = String(year);
      yearFilter.append(option);
    });
  }

  function renderGroupedPublications(container, publications, selectedCategory) {
    container.replaceChildren();

    if (!publications.length) {
      renderEmptyState(container, copy.noFilteredResults);
      return;
    }

    const allTypes = Object.keys(copy.labels).filter((item) => item !== "publication");
    const categories = selectedCategory === "all"
      ? allTypes.filter((type) => publications.some((item) => item.type === type))
      : [selectedCategory];

    categories.forEach((type) => {
      const items = publications.filter((item) => item.type === type);

      if (!items.length) {
        return;
      }

      const section = document.createElement("section");
      section.className = "publication-section";

      const heading = document.createElement("h2");
      heading.textContent = `${copy.labels[type]} (${items.length})`;
      section.append(heading);

      const years = [...new Set(items.map((item) => item.year))].sort((left, right) => right - left);

      years.forEach((year) => {
        const yearHeading = document.createElement("p");
        yearHeading.className = "publication-year-heading";
        yearHeading.textContent = String(year);
        section.append(yearHeading);

        const yearItems = items.filter((item) => item.year === year);
        section.append(buildPublicationList(yearItems, {
          includeTypeBadge: false,
          variant: "directory",
        }));
      });

      container.append(section);
    });
  }

  function buildPublicationList(publications, options) {
    const { includeTypeBadge, variant } = options;
    const list = document.createElement("ol");
    list.className = `publication-list publication-list--${variant}`;

    publications.forEach((item) => {
      const listItem = document.createElement("li");
      const article = document.createElement("article");
      article.className = `publication-entry publication-entry--${variant}`;

      const meta = document.createElement("p");
      meta.className = "publication-meta";

      if (includeTypeBadge) {
        meta.append(buildBadge(copy.labels[item.type] || copy.labels.publication));
      }

      meta.append(document.createTextNode(String(item.year)));
      article.append(meta);

      const title = document.createElement("h3");
      title.textContent = item.title;
      article.append(title);

      if (item.authors.length) {
        const authors = document.createElement("p");
        authors.className = "publication-authors";
        authors.textContent = item.authors.join(", ");
        article.append(authors);
      }

      if (item.venue) {
        const venue = document.createElement("p");
        venue.className = "publication-venue";
        venue.textContent = item.venue;
        article.append(venue);
      }

      const links = buildLinks(item);
      if (links) {
        article.append(links);
      }

      if (item.abstract) {
        article.append(buildAbstract(item.abstract));
      }

      listItem.append(article);
      list.append(listItem);
    });

    return list;
  }

  function buildBadge(label) {
    const badge = document.createElement("span");
    badge.className = "publication-badge";
    badge.textContent = label;
    return badge;
  }

  function buildLinks(item) {
    if (!item.doi && !item.url && !item.pdf) {
      return null;
    }

    const container = document.createElement("div");
    container.className = "publication-links";

    if (item.doi) {
      container.append(createLink(`https://doi.org/${item.doi}`, copy.doiLabel));
    }

    if (item.url) {
      container.append(createLink(item.url, copy.urlLabel));
    }

    if (item.pdf) {
      container.append(createLink(item.pdf, copy.pdfLabel));
    }

    return container;
  }

  function createLink(href, text) {
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = text;
    return link;
  }

  function buildAbstract(text) {
    const abstractText = String(text || "").trim();

    if (!abstractText) {
      return null;
    }

    if (abstractText.length <= abstractPreviewLength) {
      const paragraph = document.createElement("p");
      paragraph.className = "publication-abstract";
      paragraph.append(createAbstractLabel());

      const body = document.createElement("span");
      body.className = "publication-abstract-text";
      body.textContent = abstractText;
      paragraph.append(body);
      return paragraph;
    }

    const details = document.createElement("details");
    details.className = "publication-abstract publication-abstract--collapsible";

    const summary = document.createElement("summary");
    summary.append(createAbstractLabel());

    const preview = document.createElement("span");
    preview.className = "publication-abstract-preview";
    preview.textContent = truncateText(abstractText, abstractPreviewLength);
    summary.append(preview);

    const toggleMore = document.createElement("span");
    toggleMore.className = "publication-abstract-toggle publication-abstract-toggle--more";
    toggleMore.textContent = copy.abstractMore;
    summary.append(toggleMore);

    const toggleLess = document.createElement("span");
    toggleLess.className = "publication-abstract-toggle publication-abstract-toggle--less";
    toggleLess.textContent = copy.abstractLess;
    summary.append(toggleLess);

    const full = document.createElement("p");
    full.className = "publication-abstract-full";
    full.textContent = abstractText;

    details.append(summary, full);
    return details;
  }

  function createAbstractLabel() {
    const label = document.createElement("span");
    label.className = "publication-abstract-label";
    label.textContent = `${copy.abstractLabel}:`;
    return label;
  }

  function truncateText(text, maxLength) {
    if (text.length <= maxLength) {
      return text;
    }

    const trimmed = text.slice(0, maxLength).trim();
    const safeBreak = trimmed.lastIndexOf(" ");
    const excerpt = safeBreak > maxLength * 0.6 ? trimmed.slice(0, safeBreak) : trimmed;
    return `${excerpt}...`;
  }

  function renderEmptyState(container, message) {
    if (!container) {
      return;
    }

    const paragraph = document.createElement("p");
    paragraph.className = "empty-state";
    paragraph.textContent = message;
    container.replaceChildren(paragraph);
  }
}());
