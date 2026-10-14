const navigationToggle = document.querySelector(".nav-toggle");
const navigationList = document.querySelector(".nav-list");
const siteHeader = document.querySelector(".site-header");
const navigationLinks = document.querySelectorAll("[data-page-link]");
const pageViews = Array.from(document.querySelectorAll(".page-view"));

const DEFAULT_PAGE = "home";
const MOBILE_BREAKPOINT = 760;
const HEADER_SCROLL_THRESHOLD = 48;
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const pagesByName = new Map(pageViews.map(pageView => [pageView.dataset.page, pageView]));
let transitionTimeout = null;
let focusAnimationFrame = null;
let navigationRevision = 0;

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function setNavigationOpen(isOpen) {
  if (!navigationToggle || !navigationList) return;
  navigationList.classList.toggle("is-open", isOpen);
  navigationToggle.setAttribute("aria-expanded", String(isOpen));
  navigationToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
}

const isNavigationOpen = () => navigationList?.classList.contains("is-open") ?? false;
const closeNavigation = () => setNavigationOpen(false);

function initNavigation() {
  if (!navigationToggle || !navigationList) return;

  navigationToggle.addEventListener("click", () => setNavigationOpen(!isNavigationOpen()));

  navigationLinks.forEach(link => link.addEventListener("click", closeNavigation));

  document.addEventListener("click", event => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
    ) return;

    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    const hash = link?.getAttribute("href");
    if (!hash || !pagesByName.has(hash.slice(1)) || hash !== window.location.hash) return;

    event.preventDefault();
    syncPage({ scrollToTop: true });
  });

  document.querySelector(".skip-link")?.addEventListener("click", event => {
    const mainContent = document.querySelector("#content-root");
    if (!mainContent) return;

    event.preventDefault();
    closeNavigation();
    mainContent.focus({ preventScroll: true });
    mainContent.scrollIntoView({ behavior: "instant", block: "start" });
  });

  document.addEventListener("click", event => {
    if (
      isNavigationOpen() &&
      event.target instanceof Element &&
      !event.target.closest(".site-header")
    ) {
      closeNavigation();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && isNavigationOpen()) {
      closeNavigation();
      navigationToggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > MOBILE_BREAKPOINT) closeNavigation();
  });
}

function getPageFromHash(hash = window.location.hash) {
  const pageName = hash.replace("#", "").trim();
  return pagesByName.has(pageName) ? pageName : DEFAULT_PAGE;
}

function syncHash(pageName) {
  const nextHash = `#${pageName}`;
  if (window.location.hash !== nextHash) {
    history.replaceState(null, "", nextHash);
  }
}

function focusFirstHeading(container) {
  const heading = container.querySelector("h1, h2");
  if (!heading || document.activeElement === heading) return;

  heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
  heading.addEventListener("blur", () => heading.removeAttribute("tabindex"), { once: true });
}

function initSectionNavigation() {
  document.querySelectorAll("[data-scroll-to]").forEach(button => {
    button.addEventListener("click", () => {
      const section = document.getElementById(button.dataset.scrollTo);
      if (!section) return;

      focusFirstHeading(section);
      section.scrollIntoView({
        behavior: reducedMotionQuery.matches ? "auto" : "smooth",
        block: "start"
      });
    });
  });
}

function setActivePage(pageName, { scrollToTop = false, animate = true, focus = true } = {}) {
  const incomingPage = pagesByName.get(pageName);
  if (!incomingPage) return;

  const outgoingPage = pageViews.find(pageView => !pageView.hidden);
  const transitionRevision = ++navigationRevision;

  if (transitionTimeout !== null) {
    clearTimeout(transitionTimeout);
    transitionTimeout = null;
  }
  if (focusAnimationFrame !== null) {
    cancelAnimationFrame(focusAnimationFrame);
    focusAnimationFrame = null;
  }
  pagesByName.forEach(pageView => pageView.classList.remove("page-out", "page-in"));

  navigationLinks.forEach(link => {
    if (link.dataset.pageLink === pageName) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
  if (incomingPage.dataset.title) {
    document.title = incomingPage.dataset.title;
  }

  if (!outgoingPage || outgoingPage === incomingPage) {
    pagesByName.forEach((pageView, name) => {
      pageView.hidden = name !== pageName;
    });
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: "instant" });
      if (focus) focusFirstHeading(incomingPage);
    }
    return;
  }

  const showIncomingPage = () => {
    if (transitionRevision !== navigationRevision) return;

    pagesByName.forEach((pageView, name) => {
      pageView.hidden = name !== pageName;
      pageView.classList.remove("page-out", "page-in");
    });
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    const focusIncomingHeading = () => {
      if (transitionRevision !== navigationRevision || incomingPage.hidden) return;

      focusAnimationFrame = null;
      if (focus) focusFirstHeading(incomingPage);
    };

    if (animate && !reducedMotionQuery.matches) {
      incomingPage.classList.add("page-in");
      incomingPage.addEventListener("animationend", event => {
        if (event.target === incomingPage && transitionRevision === navigationRevision) {
          incomingPage.classList.remove("page-in");
        }
      }, { once: true });
      focusAnimationFrame = requestAnimationFrame(focusIncomingHeading);
    } else {
      focusIncomingHeading();
    }
    transitionTimeout = null;
  };

  if (animate && !reducedMotionQuery.matches) {
    outgoingPage.classList.add("page-out");
    transitionTimeout = setTimeout(showIncomingPage, 140);
  } else {
    showIncomingPage();
  }
}

function syncPage(options = {}) {
  const pageName = getPageFromHash();
  syncHash(pageName);
  setActivePage(pageName, options);
  closeNavigation();
}

function initHeaderScrollState() {
  if (!siteHeader) return;

  const syncHeaderState = () => {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > HEADER_SCROLL_THRESHOLD);
  };
  syncHeaderState();
  window.addEventListener("scroll", syncHeaderState, { passive: true });
}

function initCopyrightYear() {
  document.querySelectorAll("[data-year]").forEach(yearElement => {
    yearElement.textContent = new Date().getFullYear();
  });
}

const THEME_STORAGE_KEY = "theme";
const darkThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

function readStoredTheme() {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "dark" || storedTheme === "light" ? storedTheme : null;
  } catch {
    return null;
  }
}

function initThemeToggle() {
  const themeToggle = document.querySelector(".theme-toggle");
  let selectedTheme = readStoredTheme();

  function applyTheme(isDark, persistChoice) {
    const themeName = isDark ? "dark" : "light";
    document.documentElement.classList.toggle("dark-mode", isDark);
    document.documentElement.style.colorScheme = themeName;

    if (themeToggle) {
      const label = isDark ? "Switch to light mode" : "Switch to dark mode";
      themeToggle.setAttribute("aria-label", label);
      themeToggle.title = label;
      const iconReference = themeToggle.querySelector("use");
      if (iconReference) {
        iconReference.setAttribute("href", isDark ? "#icon-sun" : "#icon-moon");
      }
    }

    if (persistChoice) {
      selectedTheme = themeName;
      try {
        localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
      } catch {
        // Keep the explicit choice in this tab when saving is blocked.
      }
    }
  }

  applyTheme(selectedTheme ? selectedTheme === "dark" : darkThemeQuery.matches, false);

  themeToggle?.addEventListener("click", () => {
    applyTheme(!document.documentElement.classList.contains("dark-mode"), true);
  });

  if (typeof darkThemeQuery.addEventListener === "function") {
    darkThemeQuery.addEventListener("change", event => {
      if (!selectedTheme) applyTheme(event.matches, false);
    });
  }
  window.addEventListener("storage", event => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;

    try {
      if (event.storageArea && event.storageArea !== localStorage) return;
    } catch {
      return;
    }

    selectedTheme = event.newValue === "dark" || event.newValue === "light" ? event.newValue : null;
    applyTheme(selectedTheme ? selectedTheme === "dark" : darkThemeQuery.matches, false);
  });
}

function initBackToTop() {
  const backToTopButton = document.createElement("button");
  backToTopButton.type = "button";
  backToTopButton.className = "scroll-top";
  backToTopButton.setAttribute("aria-label", "Back to top");
  backToTopButton.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round"
      stroke-linejoin="round" aria-hidden="true" focusable="false">
      <polyline points="18 15 12 9 6 15"/>
    </svg>`;
  document.body.appendChild(backToTopButton);

  const syncButtonVisibility = () => {
    backToTopButton.classList.toggle("scroll-top--visible", window.scrollY > 500);
  };
  syncButtonVisibility();
  window.addEventListener("scroll", syncButtonVisibility, { passive: true });

  backToTopButton.addEventListener("click", () => {
    const activePage = pageViews.find(pageView => !pageView.hidden);
    if (activePage) focusFirstHeading(activePage);

    window.scrollTo({
      top: 0,
      behavior: reducedMotionQuery.matches ? "auto" : "smooth"
    });
  });
}

window.addEventListener("hashchange", () => syncPage({ scrollToTop: true }));
reducedMotionQuery.addEventListener("change", event => {
  if (event.matches) syncPage({ animate: false });
});

setNavigationOpen(false);
initThemeToggle();
initNavigation();
initSectionNavigation();
initHeaderScrollState();
initCopyrightYear();
initBackToTop();
syncPage({ scrollToTop: true, animate: false, focus: false });
