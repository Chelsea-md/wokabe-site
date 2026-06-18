(function () {
  const storageKey = "gamewiki-language-v2";
  const body = document.body;
  const languageButtons = Array.from(document.querySelectorAll("[data-lang-switch]"));
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const trendCards = Array.from(document.querySelectorAll(".trend-card"));

  function setLanguage(language) {
    const safeLanguage = language === "en" ? "en" : "ko";
    body.dataset.lang = safeLanguage;
    document.documentElement.lang = safeLanguage;

    languageButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.langSwitch === safeLanguage));
    });

    const title = safeLanguage === "en" ? body.dataset.titleEn : body.dataset.titleKo;
    if (title) {
      document.title = title;
    }

    try {
      window.localStorage.setItem(storageKey, safeLanguage);
    } catch (error) {
      // Some privacy modes block localStorage; language still works for the current page.
    }
  }

  function getInitialLanguage() {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved === "ko" || saved === "en") {
        return saved;
      }
    } catch (error) {
      return "en";
    }

    return "en";
  }

  function setFilter(filter) {
    filterButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.filter === filter);
    });

    trendCards.forEach((card) => {
      const shouldShow = filter === "all" || card.dataset.topic === filter;
      card.classList.toggle("is-hidden", !shouldShow);
    });
  }

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.langSwitch));
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => setFilter(button.dataset.filter));
  });

  setLanguage(getInitialLanguage());
  setFilter("all");
})();
