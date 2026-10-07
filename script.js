/* Page controls */
const navToggle  = document.querySelector(".nav-toggle");
const navList    = document.querySelector(".nav-list");
const siteHeader = document.querySelector(".site-header");
const pageLinks  = Array.from(document.querySelectorAll("[data-page-link]"));
const pageViews  = Array.from(document.querySelectorAll(".page-view"));

const DEFAULT_PAGE  = "home";
const MOBILE_BP     = 760;
const HEADER_SCROLL = 48;
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const pageMap = new Map(pageViews.map(v => [v.dataset.page, v]));
let transitionTimer = null;
let transitionFrame = null;
let routeRevision = 0;

if ("scrollRestoration" in history) history.scrollRestoration = "manual";

/* ---- nav ---- */
function setNavState(open) {
  if (!navToggle || !navList) return;
  navList.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
}

const isNavOpen = () => navList?.classList.contains("is-open") ?? false;
const closeNav  = () => setNavState(false);

function initNavigation() {
  if (!navToggle || !navList) return;

  navToggle.addEventListener("click", () => setNavState(!isNavOpen()));

  pageLinks.forEach(link => link.addEventListener("click", closeNav));

  document.addEventListener("click", e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
    const hash = link?.getAttribute("href");
    if (!hash || !pageMap.has(hash.slice(1)) || hash !== window.location.hash) return;
    e.preventDefault();
    syncPage({ scrollToTop: true });
  });

  document.querySelector(".skip-link")?.addEventListener("click", e => {
    const content = document.querySelector("#content-root");
    if (!content) return;
    e.preventDefault();
    closeNav();
    content.focus({ preventScroll: true });
    content.scrollIntoView({ behavior: "instant", block: "start" });
  });

  document.addEventListener("click", e => {
    if (isNavOpen() && e.target instanceof Node && !e.target.closest(".site-header")) {
      closeNav();
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && isNavOpen()) {
      closeNav();
      navToggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > MOBILE_BP) closeNav();
  });
}

/* ---- routing ---- */
function getPageFromHash(hash = window.location.hash) {
  const page = hash.replace("#", "").trim();
  return pageMap.has(page) ? page : DEFAULT_PAGE;
}

function syncHash(page) {
  const next = `#${page}`;
  if (window.location.hash !== next) history.replaceState(null, "", next);
}

function focusPageHeading(view) {
  const heading = view.querySelector("h1, h2");
  if (!heading || document.activeElement === heading) return;
  heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
  heading.addEventListener("blur", () => heading.removeAttribute("tabindex"), { once: true });
}

function setActivePage(page, { scrollToTop = false, animate = true, focus = true } = {}) {
  const incoming = pageMap.get(page);
  if (!incoming) return;

  const outgoing = [...pageMap.values()].find(v => !v.hidden);

  const revision = ++routeRevision;
  if (transitionTimer !== null) {
    clearTimeout(transitionTimer);
    transitionTimer = null;
  }
  if (transitionFrame !== null) {
    cancelAnimationFrame(transitionFrame);
    transitionFrame = null;
  }
  pageMap.forEach(v => v.classList.remove("page-out", "page-in"));

  pageLinks.forEach(link => {
    if (link.dataset.pageLink === page) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
  if (incoming.dataset.title) document.title = incoming.dataset.title;

  if (!outgoing || outgoing === incoming) {
    pageMap.forEach((v, name) => { v.hidden = name !== page; });
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: "instant" });
      if (focus) focusPageHeading(incoming);
    }
    return;
  }

  const showPage = () => {
    if (revision !== routeRevision) return;
    pageMap.forEach((v, name) => {
      v.hidden = name !== page;
      v.classList.remove("page-out", "page-in");
    });
    if (scrollToTop) window.scrollTo({ top: 0, behavior: "instant" });
    const focusHeading = () => {
      if (revision !== routeRevision || incoming.hidden) return;
      transitionFrame = null;
      if (focus) focusPageHeading(incoming);
    };
    if (animate && !motionQuery.matches) {
      incoming.classList.add("page-in");
      incoming.addEventListener("animationend", e => {
        if (e.target === incoming && revision === routeRevision) incoming.classList.remove("page-in");
      }, { once: true });
      transitionFrame = requestAnimationFrame(focusHeading);
    } else focusHeading();
    transitionTimer = null;
  };
  if (animate && !motionQuery.matches) {
    outgoing.classList.add("page-out");
    transitionTimer = setTimeout(showPage, 140);
  } else showPage();
}

function syncPage({ scrollToTop = false, animate = true, focus = true } = {}) {
  const page = getPageFromHash();
  syncHash(page);
  setActivePage(page, { scrollToTop, animate, focus });
  closeNav();
}

/* ---- header shadow ---- */
function initHeader() {
  if (!siteHeader) return;
  const sync = () => siteHeader.classList.toggle("is-scrolled", window.scrollY > HEADER_SCROLL);
  sync();
  window.addEventListener("scroll", sync, { passive: true });
}

/* ---- footer year ---- */
function initYear() {
  document.querySelectorAll("[data-year]").forEach(el => {
    el.textContent = new Date().getFullYear();
  });
}

/* The head script sets the initial theme before paint. */
const THEME_KEY = "theme";
const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

function readStoredTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

function initThemeToggle() {
  const btn = document.querySelector(".theme-toggle");
  let choice = readStoredTheme();

  function applyTheme(dark, persist) {
    document.documentElement.classList.toggle("dark-mode", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    if (btn) {
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      btn.title = dark ? "Switch to light mode" : "Switch to dark mode";
      const use = btn.querySelector("use");
      if (use) use.setAttribute("href", dark ? "#icon-sun" : "#icon-moon");
    }
    if (persist) {
      choice = dark ? "dark" : "light";
      try {
        localStorage.setItem(THEME_KEY, choice);
      } catch { /* Keep the choice for this page when storage is blocked. */ }
    }
  }

  applyTheme(choice ? choice === "dark" : darkQuery.matches, false);

  btn?.addEventListener("click", () => {
    applyTheme(!document.documentElement.classList.contains("dark-mode"), true);
  });

  if (typeof darkQuery.addEventListener === "function") {
    darkQuery.addEventListener("change", e => {
      if (!choice) applyTheme(e.matches, false);
    });
  }
  window.addEventListener("storage", e => {
    if (e.key !== THEME_KEY && e.key !== null) return;
    try {
      if (e.storageArea && e.storageArea !== localStorage) return;
    } catch { return; }
    choice = e.newValue === "dark" || e.newValue === "light" ? e.newValue : null;
    applyTheme(choice ? choice === "dark" : darkQuery.matches, false);
  });
}

/* ---- scroll-to-top button ---- */
function initScrollToTop() {
  const btn = document.createElement("button");
  btn.className = "scroll-top";
  btn.setAttribute("aria-label", "Back to top");
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`;
  document.body.appendChild(btn);

  const sync = () => {
    btn.classList.toggle("scroll-top--visible", window.scrollY > 500);
  };
  sync();
  window.addEventListener("scroll", sync, { passive: true });

  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: motionQuery.matches ? "auto" : "smooth" }));
}

/* ---- boot ---- */
window.addEventListener("hashchange", () => syncPage({ scrollToTop: true }));
motionQuery.addEventListener("change", e => {
  if (e.matches) syncPage({ animate: false });
});

setNavState(false);
initThemeToggle();
initNavigation();
initHeader();
initYear();
initScrollToTop();
syncPage({ scrollToTop: true, animate: false, focus: false });
