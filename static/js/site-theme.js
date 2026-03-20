(function () {
  const storageKey = "site-theme-preference";
  const root = document.documentElement;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const darkThemeColor = "#0f1722";
  const lightThemeColor = "#edf3f8";

  function getPreferredTheme() {
    const saved = window.localStorage.getItem(storageKey);

    if (saved === "light" || saved === "dark") {
      return saved;
    }

    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);

    if (themeMeta) {
      themeMeta.setAttribute("content", theme === "light" ? lightThemeColor : darkThemeColor);
    }

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.setAttribute("data-theme-state", theme);
      button.setAttribute("aria-pressed", String(theme === "light"));
      const currentThemeLabel = theme === "light"
        ? button.getAttribute("data-theme-label-light")
        : button.getAttribute("data-theme-label-dark");
      const nextActionLabel = theme === "light"
        ? button.getAttribute("data-theme-action-dark")
        : button.getAttribute("data-theme-action-light");
      if (currentThemeLabel && nextActionLabel) {
        button.setAttribute("aria-label", `${currentThemeLabel}. ${nextActionLabel}.`);
      }
    });
  }

  function toggleTheme() {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    window.localStorage.setItem(storageKey, next);
    applyTheme(next);
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(getPreferredTheme());

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", toggleTheme);
    });
  });
}());
