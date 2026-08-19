"use strict";

/* =======================================================
   Header initialization
======================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const mainNav = document.getElementById("mainNav");

  if (!mainNav) {
    return;
  }

  if (
    typeof DATA_SECTIONS === "undefined" ||
    typeof DATA_SECTION_ORDER === "undefined" ||
    typeof FRAMEWORKS === "undefined" ||
    typeof NAVIGATION === "undefined"
  ) {
    console.error("Header data is not available.");
    return;
  }

  renderHeader();
});

/* =======================================================
   Render header
======================================================= */

function renderHeader() {
  const mainNav = document.getElementById("mainNav");

  if (!mainNav) {
    return;
  }

  let html = "";

  /* ---------------------------------------------------
     Home
  --------------------------------------------------- */

  html += renderHomeNavigation();

  /* ---------------------------------------------------
     Catalogue sections
  --------------------------------------------------- */

  html += renderCatalogueNavigation();

  /* ---------------------------------------------------
     Frameworks
  --------------------------------------------------- */

  html += renderFrameworkNavigation();

  /* ---------------------------------------------------
     Main navigation
  --------------------------------------------------- */

  html += renderMainNavigation();

  /* ---------------------------------------------------
     Insert
  --------------------------------------------------- */

  mainNav.innerHTML = html;

  /* ---------------------------------------------------
     Setup interactions
  --------------------------------------------------- */

  setupCategoryNavigation();
  setupFrameworkNavigation();
  setupMobileNavigation();
}

/* =======================================================
   Home navigation
======================================================= */

function renderHomeNavigation() {
  if (!NAVIGATION.home) {
    return "";
  }

  return `
    <a href="${escapeAttribute(NAVIGATION.home.path)}">
      ${escapeHtml(NAVIGATION.home.name)}
    </a>
  `;
}

/* =======================================================
   Catalogue navigation
======================================================= */

function renderCatalogueNavigation() {
  let html = "";

  for (const sectionKey of DATA_SECTION_ORDER) {
    const section = DATA_SECTIONS[sectionKey];

    if (!section) {
      continue;
    }

    const sectionPath = section.path || `/${sectionKey}/`;

    /*
     * Sections without categories are simple links.
     */
    if (!section.categories) {
      html += `
        <a
          href="${escapeAttribute(sectionPath)}"
          data-section="${escapeAttribute(sectionKey)}"
          class="nav-section-link"
        >
          ${escapeHtml(section.name)}
        </a>
      `;

      continue;
    }

    /*
     * Sections with categories use dropdown.
     */
    html += `
      <div class="nav-dropdown">

        <a
          class="nav-section-button"
          href="${escapeAttribute(sectionPath)}"
          data-section="${escapeAttribute(sectionKey)}"
        >
          ${escapeHtml(section.name)}
        </a>

        <div class="dropdown-menu">

          <a
            class="nav-category-link nav-all-button"
            href="${escapeAttribute(sectionPath)}"
            data-section="${escapeAttribute(sectionKey)}"
            data-category="all"
          >
            ${escapeHtml(section.name)} (All)
          </a>
    `;

    for (const [categoryKey, categoryName] of Object.entries(
      section.categories,
    )) {
      html += `
        <a
          class="nav-category-link"
          href="${escapeAttribute(
            `${sectionPath}${categoryKey}/`,
          )}"
          data-section="${escapeAttribute(sectionKey)}"
          data-category="${escapeAttribute(categoryKey)}"
        >
          ${escapeHtml(categoryName)}
        </a>
      `;
    }

    html += `
        </div>

      </div>
    `;
  }

  return html;
}

/* =======================================================
   Framework navigation
======================================================= */

function renderFrameworkNavigation() {
  if (
    typeof FRAMEWORKS === "undefined" ||
    !FRAMEWORKS ||
    Object.keys(FRAMEWORKS).length === 0
  ) {
    return "";
  }

  let html = `
    <div class="nav-dropdown">

      <button
        type="button"
        class="nav-section-button framework-nav-button"
        aria-expanded="false"
      >
        Frameworks
      </button>

      <div class="framework-dropdown-menu">
  `;

  for (const [frameworkKey, framework] of Object.entries(FRAMEWORKS)) {
    const frameworkPath =
      framework.path || `/${frameworkKey}/`;

    html += `
      <a
        href="${escapeAttribute(frameworkPath)}"
        class="framework-link"
        data-framework="${escapeAttribute(frameworkKey)}"
      >
        ${escapeHtml(framework.name)}
      </a>
    `;
  }

  html += `
      </div>

    </div>
  `;

  return html;
}

/* =======================================================
   Main navigation
======================================================= */

function renderMainNavigation() {
  let html = "";

  for (const key of ["libraries", "tools", "projects", "about"]) {
    const item = NAVIGATION[key];

    if (!item) {
      continue;
    }

    html += `
      <a href="${escapeAttribute(item.path)}">
        ${escapeHtml(item.name)}
      </a>
    `;
  }

  return html;
}

/* =======================================================
   Catalogue category navigation
======================================================= */

function setupCategoryNavigation() {
  /*
   * Category links.
   *
   * These are mostly normal <a> links now.
   * We intentionally do not intercept navigation.
   *
   * This allows:
   *
   * /ai/
   * /flutter/
   * /dotnet/
   * /ai/something/
   *
   * to load naturally.
   */

  const links = document.querySelectorAll(
    ".nav-category-link",
  );

  links.forEach((link) => {
    link.addEventListener("click", () => {
      closeMobileNavigation();
    });
  });
}

/* =======================================================
   Framework navigation
======================================================= */

function setupFrameworkNavigation() {
  const frameworkLinks = document.querySelectorAll(
    ".framework-link",
  );

  frameworkLinks.forEach((link) => {
    link.addEventListener("click", () => {
      /*
       * Do NOT call loadCatalog() here.
       *
       * The framework page will load normally.
       *
       * app.js reads:
       *
       * /react/
       *
       * and resolves:
       *
       * react -> frameworks.json
       */
      closeMobileNavigation();
    });
  });
}

/* =======================================================
   Mobile navigation
======================================================= */

function setupMobileNavigation() {
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  if (!menuToggle || !mainNav) {
    return;
  }

  if (menuToggle.dataset.navigationReady === "true") {
    return;
  }

  menuToggle.dataset.navigationReady = "true";

  /* ---------------------------------------------------
     Hamburger
  --------------------------------------------------- */

  menuToggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const isOpen = mainNav.classList.toggle("open");

    mainNav.style.display = isOpen ? "flex" : "";

    menuToggle.setAttribute(
      "aria-expanded",
      String(isOpen),
    );
  });

  /* ---------------------------------------------------
     Mobile dropdowns
  --------------------------------------------------- */

  mainNav.addEventListener("click", (event) => {
    if (window.innerWidth > 860) {
      return;
    }

    const sectionButton = event.target.closest(
      ".nav-section-button",
    );

    if (!sectionButton) {
      return;
    }

    /*
     * Framework button is a dropdown button.
     */
    if (
      sectionButton.classList.contains(
        "framework-nav-button",
      )
    ) {
      event.preventDefault();
      event.stopPropagation();

      const dropdown =
        sectionButton.closest(".nav-dropdown");

      if (!dropdown) {
        return;
      }

      const isActive =
        dropdown.classList.toggle("active");

      sectionButton.setAttribute(
        "aria-expanded",
        String(isActive),
      );

      return;
    }

    /*
     * Normal section button.
     *
     * Only prevent navigation on mobile when
     * it belongs to an actual dropdown.
     */
    const dropdown =
      sectionButton.closest(".nav-dropdown");

    if (!dropdown) {
      return;
    }

    const menu =
      dropdown.querySelector(".dropdown-menu");

    if (!menu) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    dropdown.classList.toggle("active");
  });
}

/* =======================================================
   Close mobile navigation
======================================================= */

function closeMobileNavigation() {
  const mainNav = document.getElementById("mainNav");
  const menuToggle = document.getElementById("menuToggle");

  if (mainNav) {
    mainNav.classList.remove("open");

    mainNav.querySelectorAll(".nav-dropdown").forEach(
      (dropdown) => {
        dropdown.classList.remove("active");
      },
    );

    mainNav
      .querySelectorAll(".nav-section-button")
      .forEach((button) => {
        button.setAttribute(
          "aria-expanded",
          "false",
        );
      });

    /*
     * Let CSS control display after closing.
     */
    mainNav.style.display = "";
  }

  if (menuToggle) {
    menuToggle.setAttribute(
      "aria-expanded",
      "false",
    );
  }
}

/* =======================================================
   HTML escaping
======================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}