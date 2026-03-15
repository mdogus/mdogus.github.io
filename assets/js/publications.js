const PUBLICATION_LABELS = {
  article: "Makale",
  book: "Kitap",
  conference: "Bildiri",
  thesis: "Tez",
};

document.addEventListener("DOMContentLoaded", () => {
  const publications = readPublications();

  if (!publications.length) {
    renderEmptyState(document.getElementById("featured-publications"), "Öne çıkan yayın verisi bulunamadı.");
    renderEmptyState(document.getElementById("publications-directory"), "Yayın kaydı bulunamadı.");
    return;
  }

  initFeaturedPublications(publications);
  initPublicationDirectory(publications);
});

function readPublications() {
  const source = document.getElementById("publications-data");

  if (!source) {
    return [];
  }

  try {
    const parsed = JSON.parse(source.textContent);

    return parsed
      .map((item) => normalizePublication(item))
      .sort(comparePublications);
  } catch (error) {
    console.error("Publication data could not be parsed.", error);
    return [];
  }
}

function normalizePublication(item) {
  return {
    ...item,
    authors: Array.isArray(item.authors) ? item.authors : [item.authors].filter(Boolean),
    year: Number(item.year) || 0,
    venue: item.venue || "",
    type: item.type || "article",
    abstract: item.abstract || "",
    featured: Boolean(item.featured),
  };
}

function comparePublications(left, right) {
  if (left.year !== right.year) {
    return right.year - left.year;
  }

  return left.title.localeCompare(right.title, "tr");
}

function initFeaturedPublications(publications) {
  const container = document.getElementById("featured-publications");

  if (!container) {
    return;
  }

  const featuredItems = publications.filter((item) => item.featured).slice(0, 3);

  if (!featuredItems.length) {
    renderEmptyState(container, "Henüz öne çıkan yayın seçilmedi.");
    return;
  }

  container.replaceChildren(buildPublicationList(featuredItems, false));
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

    feedback.textContent = `${filtered.length} yayın listeleniyor.`;
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
    renderEmptyState(container, "Seçili filtrelerle eşleşen yayın bulunamadı.");
    return;
  }

  const categories = selectedCategory === "all"
    ? Object.keys(PUBLICATION_LABELS).filter((type) => publications.some((item) => item.type === type))
    : [selectedCategory];

  categories.forEach((type) => {
    const items = publications.filter((item) => item.type === type);

    if (!items.length) {
      return;
    }

    const section = document.createElement("section");
    section.className = "publication-section";

    const heading = document.createElement("h3");
    heading.textContent = `${PUBLICATION_LABELS[type]} (${items.length})`;
    section.append(heading);

    const years = [...new Set(items.map((item) => item.year))].sort((left, right) => right - left);

    years.forEach((year) => {
      const yearHeading = document.createElement("p");
      yearHeading.className = "publication-year-heading";
      yearHeading.textContent = String(year);
      section.append(yearHeading);

      const yearItems = items.filter((item) => item.year === year);
      section.append(buildPublicationList(yearItems, true));
    });

    container.append(section);
  });
}

function buildPublicationList(publications, includeTypeBadge) {
  const list = document.createElement("ol");
  list.className = "publication-list";

  publications.forEach((item) => {
    const listItem = document.createElement("li");
    const article = document.createElement("article");
    article.className = "publication-entry";

    const meta = document.createElement("p");
    meta.className = "publication-meta";

    if (includeTypeBadge) {
      meta.append(buildBadge(PUBLICATION_LABELS[item.type] || "Yayın"));
    }

    meta.append(`${item.year}`);
    article.append(meta);

    const title = document.createElement("h4");
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
      const abstract = document.createElement("p");
      abstract.className = "publication-abstract";
      abstract.textContent = item.abstract;
      article.append(abstract);
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
  const hasLinks = item.doi || item.url || item.pdf;

  if (!hasLinks) {
    return null;
  }

  const container = document.createElement("div");
  container.className = "publication-links";

  if (item.doi) {
    container.append(createLink(`https://doi.org/${item.doi}`, "DOI kaydını aç"));
  }

  if (item.url) {
    container.append(createLink(item.url, "Yayın sayfasını aç"));
  }

  if (item.pdf) {
    container.append(createLink(item.pdf, "PDF dosyasını aç"));
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

function renderEmptyState(container, message) {
  if (!container) {
    return;
  }

  const paragraph = document.createElement("p");
  paragraph.className = "empty-state";
  paragraph.textContent = message;
  container.replaceChildren(paragraph);
}
