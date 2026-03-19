(function () {
  const body = document.body;
  if (!body) {
    return;
  }

  const pathTr = body.dataset.pathTr;
  const pathEn = body.dataset.pathEn;
  const currentLocale = document.documentElement.lang.toLowerCase().startsWith("tr") ? "tr" : "en";
  const preferredLocale = window.localStorage.getItem("site-language-preference")
    || (String(window.navigator.language || "").toLowerCase().startsWith("tr") ? "tr" : "en");

  if (preferredLocale !== currentLocale) {
    const target = preferredLocale === "tr" ? pathTr : pathEn;

    if (target && target !== window.location.pathname) {
      window.location.replace(target);
      return;
    }
  }

  document.querySelectorAll(".language-switcher__link[data-lang]").forEach((link) => {
    link.addEventListener("click", () => {
      window.localStorage.setItem("site-language-preference", link.dataset.lang);
    });
  });
})();
