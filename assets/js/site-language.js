(function () {
  const PATHS = {
    home: { tr: "/index.html", en: "/en/index.html" },
    bio: { tr: "/bio.html", en: "/en/bio.html" },
    publications: { tr: "/publications.html", en: "/en/publications.html" },
    contact: { tr: "/contact.html", en: "/en/contact.html" },
    notFound: { tr: "/404.html", en: "/en/404.html" },
  };

  const COPY = {
    tr: {
      skipLink: "Ana içeriğe geç",
      footerEyebrow: "Akademik Kişisel Site",
      footerMeta: "Akademik unvan | Bölüm / Kurum",
      footerNavAria: "Alt gezinme",
      footerProfilesAria: "Akademik profiller",
      languageLabel: "Dil",
      nav: {
        home: "Ana Sayfa",
        bio: "Bio",
        publications: "Yayınlar",
        contact: "İletişim",
      },
    },
    en: {
      skipLink: "Skip to main content",
      footerEyebrow: "Academic Personal Site",
      footerMeta: "Academic title | Department / Institution",
      footerNavAria: "Footer navigation",
      footerProfilesAria: "Academic profiles",
      languageLabel: "Language",
      nav: {
        home: "Home",
        bio: "Bio",
        publications: "Publications",
        contact: "Contact",
      },
    },
  };

  const STORAGE_KEY = "site-language-preference";
  const currentPath = window.location.pathname;
  const currentLocale = currentPath.startsWith("/en/") || currentPath === "/en" ? "en" : "tr";
  const pageKey = getPageKey(currentPath);
  const storedPreference = window.localStorage.getItem(STORAGE_KEY);

  if (pageKey) {
    const preferredLocale = storedPreference
      || (String(window.navigator.language || "").toLowerCase().startsWith("tr") ? "tr" : "en");

    if (preferredLocale !== currentLocale) {
      window.location.replace(buildTargetPath(pageKey, preferredLocale));
      return;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyCopy(currentLocale);
    updateNavigation(currentLocale);
    renderLanguageSwitcher(currentLocale, pageKey);
  });

  function getPageKey(pathname) {
    const normalized = pathname.replace(/\/+$/, "") || "/";
    const pageMap = {
      "/": "home",
      "/index.html": "home",
      "/bio.html": "bio",
      "/publications.html": "publications",
      "/contact.html": "contact",
      "/404.html": "notFound",
      "/en": "home",
      "/en/index.html": "home",
      "/en/bio.html": "bio",
      "/en/publications.html": "publications",
      "/en/contact.html": "contact",
      "/en/404.html": "notFound",
    };

    return pageMap[normalized] || null;
  }

  function buildTargetPath(targetPage, targetLocale) {
    const target = PATHS[targetPage]?.[targetLocale];

    if (!target) {
      return currentPath;
    }

    return `${target}${window.location.search}${window.location.hash}`;
  }

  function applyCopy(locale) {
    const copy = COPY[locale];

    document.documentElement.lang = locale;

    document.querySelectorAll("[data-copy]").forEach((node) => {
      const key = node.getAttribute("data-copy");
      if (copy[key]) {
        node.textContent = copy[key];
      }
    });

    document.querySelectorAll("[data-copy-aria]").forEach((node) => {
      const key = node.getAttribute("data-copy-aria");
      if (copy[key]) {
        node.setAttribute("aria-label", copy[key]);
      }
    });
  }

  function updateNavigation(locale) {
    const copy = COPY[locale];
    const navOrder = ["home", "bio", "publications", "contact"];
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");

    navLinks.forEach((link, index) => {
      const key = navOrder[index];
      if (!key) {
        return;
      }

      link.href = PATHS[key][locale];

      const textNode = link.querySelector(".menu-text");
      if (textNode) {
        textNode.textContent = copy.nav[key];
      }
    });

    const brand = document.querySelector(".navbar-brand");
    if (brand) {
      brand.href = PATHS.home[locale];
    }

    document.querySelectorAll("[data-page-link]").forEach((link) => {
      const key = link.getAttribute("data-page-link");
      const label = link.querySelector("[data-nav-label]");

      if (PATHS[key]) {
        link.setAttribute("href", PATHS[key][locale]);
      }

      if (label && copy.nav[key]) {
        label.textContent = copy.nav[key];
      }
    });
  }

  function renderLanguageSwitcher(locale, currentPage) {
    const tools = document.querySelector(".quarto-navbar-tools");
    if (!tools) {
      return;
    }

    const existing = tools.querySelector(".language-switcher");
    if (existing) {
      existing.remove();
    }

    const switcher = document.createElement("div");
    switcher.className = "language-switcher";
    switcher.setAttribute("aria-label", COPY[locale].languageLabel);

    ["tr", "en"].forEach((targetLocale) => {
      const link = document.createElement("a");
      link.className = "language-switcher__link";
      link.textContent = targetLocale.toUpperCase();
      link.href = currentPage ? buildTargetPath(currentPage, targetLocale) : PATHS.home[targetLocale];
      link.setAttribute("hreflang", targetLocale);

      if (targetLocale === locale) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "true");
      }

      link.addEventListener("click", () => {
        window.localStorage.setItem(STORAGE_KEY, targetLocale);
      });

      switcher.append(link);
    });

    tools.append(switcher);
  }
})();
