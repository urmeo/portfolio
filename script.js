/* ---- refs ---- */
const navToggle  = document.querySelector(".nav-toggle");
const navList    = document.querySelector(".nav-list");
const siteHeader = document.querySelector(".site-header");
const pageLinks  = Array.from(document.querySelectorAll("[data-page-link]"));
const pageViews  = Array.from(document.querySelectorAll(".page-view"));

const DEFAULT_PAGE  = "home";
const MOBILE_BP     = 760;
const HEADER_SCROLL = 48;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const TRANSITION_MS = reducedMotion ? 0 : 260;

const pageMap = new Map(pageViews.map(v => [v.dataset.page, v]));
let transitionTimer = null;

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
    if (isNavOpen() && e.target instanceof Node && !e.target.closest(".site-header")) {
      closeNav();
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeNav();
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

function setActivePage(page, { scrollToTop = false } = {}) {
  const incoming = pageMap.get(page);
  if (!incoming) return;

  const outgoing = [...pageMap.values()].find(v => !v.hidden);

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
    return;
  }

  if (transitionTimer) {
    clearTimeout(transitionTimer);
    transitionTimer = null;
  }

  outgoing.classList.add("page-out");

  transitionTimer = setTimeout(() => {
    outgoing.hidden = true;
    outgoing.classList.remove("page-out");

    if (scrollToTop) window.scrollTo({ top: 0, behavior: "auto" });

    incoming.hidden = false;

    requestAnimationFrame(() => {
      incoming.classList.add("page-in");

      // move focus to first heading for keyboard / screen-reader users
      const heading = incoming.querySelector("h1, h2");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
        heading.addEventListener("blur", () => heading.removeAttribute("tabindex"), { once: true });
      }

      incoming.addEventListener("animationend", () => {
        incoming.classList.remove("page-in");
      }, { once: true });
    });

    transitionTimer = null;
  }, TRANSITION_MS);
}

function syncPage({ scrollToTop = false } = {}) {
  const page = getPageFromHash();
  syncHash(page);
  setActivePage(page, { scrollToTop });
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

/* ---- hero entrance animation ---- */
function initHeroEntrance() {
  if (reducedMotion) return;
  if (getPageFromHash() !== DEFAULT_PAGE) return;

  const items = [
    { el: document.querySelector(".hero-media"),   cls: "hero-slide", delay: 0   },
    { el: document.querySelector(".hero-copy h1"), cls: "hero-fade",  delay: 120 },
    { el: document.querySelector(".hero-role"),    cls: "hero-fade",  delay: 230 },
  ];

  document.querySelectorAll(".hero-bio").forEach((el, i) => {
    items.push({ el, cls: "hero-fade", delay: 340 + i * 80 });
  });

  items.forEach(({ el, cls }) => { if (el) el.classList.add(cls); });

  requestAnimationFrame(() => {
    items.forEach(({ el, delay }) => {
      if (!el) return;
      setTimeout(() => el.classList.add("hero-visible"), delay);
    });
  });
}

/* ---- scroll reveal ---- */
function initRevealAnimations() {
  if (reducedMotion) return;

  const staggerRules = [
    { selector: ".hobby-grid .hobby-card",    delay: 80  },
    { selector: ".record-list .record-entry", delay: 110 },
    { selector: ".paper-entry",               delay: 90  },
    { selector: ".skills-grid .skill-row",    delay: 55  },
  ];

  staggerRules.forEach(({ selector, delay }) => {
    const groups = new Map();
    document.querySelectorAll(selector).forEach(el => {
      const parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });
    groups.forEach(items => items.forEach((el, i) => {
      el.dataset.revealDelay = i * delay;
    }));
  });

  const targets = document.querySelectorAll([
    ".paper-entry",
    ".record-entry",
    ".hobby-card",
    ".content-section > h2",
    ".page-title",
    ".skill-row",
    ".awards-copy p",
    ".service-list li",
  ].join(", "));

  targets.forEach(el => el.classList.add("reveal"));

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const delay = Number(entry.target.dataset.revealDelay ?? 0);
      entry.target.style.transitionDelay = `${delay}ms`;
      entry.target.classList.add("is-revealed");
      entry.target.addEventListener("transitionend", () => {
        entry.target.style.transitionDelay = "";
      }, { once: true });
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -20px 0px" });

  targets.forEach(el => observer.observe(el));
}

/* ---- lazy image fade ---- */
function initImageFade() {
  document.querySelectorAll("img[loading='lazy']").forEach(img => {
    const reveal = () => img.classList.add("img-loaded");
    if (img.complete) {
      reveal();
    } else {
      img.addEventListener("load",  reveal, { once: true });
      img.addEventListener("error", reveal, { once: true });
    }
  });
}

/* ---- video: pause when offscreen ---- */
function initVideoObserver() {
  const videos = document.querySelectorAll("video[autoplay]");
  if (!videos.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.25 });

  videos.forEach(v => observer.observe(v));
}

/* ---- dark mode toggle ---- */
function initThemeToggle() {
  const btn = document.querySelector(".theme-toggle");
  if (!btn) return;

  function applyTheme(dark, persist) {
    document.body.classList.toggle("dark-mode", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    btn.title = dark ? "Switch to light mode" : "Switch to dark mode";
    const use = btn.querySelector("use");
    if (use) use.setAttribute("href", dark ? "#icon-sun" : "#icon-moon");
    if (persist) localStorage.setItem("theme", dark ? "dark" : "light");
  }

  // Light by default — only restore dark if user explicitly chose it
  applyTheme(localStorage.getItem("theme") === "dark", false);

  btn.addEventListener("click", () => {
    applyTheme(!document.body.classList.contains("dark-mode"), true);
  });
}

/* ---- copy email ---- */
function initCopyEmail() {
  const link = document.querySelector(".plink--email");
  if (!link) return;

  const email = "urmebose05@gmail.com";
  const originalLabel = link.getAttribute("aria-label");
  const originalTitle = link.title;

  link.addEventListener("click", e => {
    e.preventDefault();
    navigator.clipboard.writeText(email).then(() => {
      link.setAttribute("aria-label", "Copied!");
      link.title = "Copied!";
      link.classList.add("plink--copied");
      setTimeout(() => {
        link.setAttribute("aria-label", originalLabel);
        link.title = originalTitle;
        link.classList.remove("plink--copied");
      }, 2200);
    }).catch(() => {
      window.location.href = `mailto:${email}`;
    });
  });
}

/* ---- scroll-to-top button ---- */
function initScrollToTop() {
  const btn = document.createElement("button");
  btn.className = "scroll-top";
  btn.setAttribute("aria-label", "Back to top");
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`;
  document.body.appendChild(btn);

  window.addEventListener("scroll", () => {
    btn.classList.toggle("scroll-top--visible", window.scrollY > 500);
  }, { passive: true });

  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* ---- boot ---- */
window.addEventListener("hashchange", () => syncPage({ scrollToTop: true }));

setNavState(false);
initThemeToggle();
initNavigation();
initHeader();
initYear();
initHeroEntrance();
initRevealAnimations();
initImageFade();
initVideoObserver();
initScrollToTop();
initCopyEmail();
syncPage({ scrollToTop: true });
