"use strict";

/* =======================================================
   CODER BASKET — DYNAMIC HEADER
======================================================= */

/*
 * This file is completely self-contained.
 *
 * It:
 *
 * 1. Loads /css/header.css automatically.
 * 2. Creates the entire header.
 * 3. Inserts it at the very top of <body>.
 * 4. Requires no header markup in index.html.
 *
 * Required global data:
 *
 *   DATA_SECTIONS
 *   DATA_SECTION_ORDER
 *   FRAMEWORKS
 *   NAVIGATION
 *
 * The only HTML requirement is:
 *
 *   <script src="/js/header.js" defer></script>
 */

/* =======================================================
   INITIALIZATION
======================================================= */

(function initializeDynamicHeader() {

  /*
   * Load header CSS immediately.
   */
  loadHeaderStylesheet();

  /*
   * Wait until the document exists.
   */
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeHeader,
      { once: true }
    );
  } else {
    initializeHeader();
  }

})();


/* =======================================================
   LOAD HEADER CSS
======================================================= */

function loadHeaderStylesheet() {

  const cssPath = "/css/header.css";

  /*
   * Avoid loading the stylesheet twice.
   */
  if (
    document.querySelector(
      `link[rel="stylesheet"][href="${cssPath}"]`
    )
  ) {
    return;
  }

  const link = document.createElement("link");

  link.rel = "stylesheet";
  link.href = cssPath;

  document.head.appendChild(link);
}


/* =======================================================
   INITIALIZE HEADER
======================================================= */

function initializeHeader() {

  /*
   * Do not create duplicate headers.
   */
  if (document.getElementById("siteHeader")) {
    return;
  }

  /*
   * DATA files may be deferred and may not have
   * finished executing yet.
   *
   * Wait briefly until the required data exists.
   */
  if (!headerDataReady()) {

    let attempts = 0;

    const maxAttempts = 100;

    const waitForData = setInterval(() => {

      attempts++;

      if (headerDataReady()) {

        clearInterval(waitForData);

        renderHeader();

        return;
      }

      if (attempts >= maxAttempts) {

        clearInterval(waitForData);

        console.error(
          "[Header] Required navigation data was not available."
        );

      }

    }, 50);

    return;
  }

  renderHeader();
}


/* =======================================================
   CHECK HEADER DATA
======================================================= */

function headerDataReady() {

  return (
    typeof DATA_SECTIONS !== "undefined" &&
    typeof DATA_SECTION_ORDER !== "undefined" &&
    typeof FRAMEWORKS !== "undefined" &&
    typeof NAVIGATION !== "undefined"
  );
}


/* =======================================================
   RENDER COMPLETE HEADER
======================================================= */

function renderHeader() {

  /*
   * Create the header itself.
   */
  const header = document.createElement("header");

  header.id = "siteHeader";
  header.className = "site-header";

  const home = NAVIGATION?.home || {
    name: "Coder Basket",
    path: "/"
  };

  const submit = NAVIGATION?.submit || {
    name: "Submit",
    path: "/submit/"
  };

  header.innerHTML = `
    <div class="container header-inner">

      ${renderLogo(home)}

      <div class="mobile-header-actions">

        ${renderMobileSubmit(submit)}

        <button
          type="button"
          class="menu-toggle"
          id="menuToggle"
          aria-label="Open navigation"
          aria-expanded="false"
        >
          ☰
        </button>

      </div>

      <nav
        id="mainNav"
        class="main-nav"
        aria-label="Main navigation"
      >

        ${renderCatalogueNavigation()}

        ${renderFrameworkNavigation()}

        ${renderMainNavigation()}

      </nav>

    </div>
  `;

  /*
   * Insert as the FIRST element inside body.
   */
  document.body.prepend(header);

  /*
   * Setup interactions.
   */
  setupCategoryNavigation();
  setupFrameworkNavigation();
  setupMobileNavigation();
}


/* =======================================================
   LOGO
======================================================= */

function renderLogo(home) {

  const homePath =
    home?.path || "/";

  const homeName = "Coder Basket";

  return `
    <a
      href="${escapeAttribute(homePath)}"
      class="logo"
      aria-label="${escapeAttribute(homeName)}"
    >

      <img
        src="/assets/icon.svg"
        alt="Coder Basket"
      >

      <span>
        ${escapeHtml(homeName)}
      </span>

    </a>
  `;
}


/* =======================================================
   MOBILE SUBMIT (+)
======================================================= */

function renderMobileSubmit(submit) {

  if (!submit) {
    return "";
  }

  const path =
    submit.path || "/submit/";

  const name =
    submit.name || "Submit";

  return `
    <a
      id="mobileSubmitNavigation"
      class="mobile-submit-button"
      href="${escapeAttribute(path)}"
      aria-label="${escapeAttribute(name)}"
      title="${escapeAttribute(name)}"
    >
      +
    </a>
  `;
}


/* =======================================================
   CATALOGUE NAVIGATION
======================================================= */

function renderCatalogueNavigation() {

  let html = "";

  for (const sectionKey of DATA_SECTION_ORDER) {

    const section =
      DATA_SECTIONS[sectionKey];

    if (!section) {
      continue;
    }

    const sectionPath =
      section.path || `/${sectionKey}/`;

    /*
     * -----------------------------------------------
     * Section WITHOUT categories
     * -----------------------------------------------
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
     * -----------------------------------------------
     * Section WITH categories
     * -----------------------------------------------
     */

    html += `
      <div class="nav-dropdown">

        <a
          href="${escapeAttribute(sectionPath)}"
          class="nav-section-button"
          data-section="${escapeAttribute(sectionKey)}"
          aria-expanded="false"
        >
          ${escapeHtml(section.name)}
        </a>

        <div class="dropdown-menu">

          <a
            href="${escapeAttribute(sectionPath)}"
            class="nav-category-link nav-all-button"
            data-section="${escapeAttribute(sectionKey)}"
            data-category="all"
          >
            ${escapeHtml(section.name)} (All)
          </a>
    `;


    for (
      const [categoryKey, categoryName]
      of Object.entries(section.categories)
    ) {

      html += `
        <a
          href="${escapeAttribute(
            `${sectionPath}${categoryKey}/`
          )}"
          class="nav-category-link"
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
   FRAMEWORK NAVIGATION
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


  for (
    const [frameworkKey, framework]
    of Object.entries(FRAMEWORKS)
  ) {

    const frameworkPath =
      framework.path ||
      `/${frameworkKey}/`;

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
   MAIN NAVIGATION
======================================================= */

function renderMainNavigation() {

  let html = "";

  /*
   * Tools
   * About
   * Submit
   *
   * Home is intentionally NOT here because
   * the logo already links to Home.
   */

  for (
    const key of ["tools", "about", "submit"]
  ) {

    const item =
      NAVIGATION[key];

    if (!item) {
      continue;
    }


    /*
     * Desktop Submit button.
     */
    if (key === "submit") {

      html += `
        <a
          id="submitNavigation"
          class="submit-navigation-link"
          href="${escapeAttribute(item.path)}"
        >
          ${escapeHtml(item.name)}
        </a>
      `;

      continue;
    }


    /*
     * Normal navigation item.
     */

    html += `
      <a
        href="${escapeAttribute(item.path)}"
      >
        ${escapeHtml(item.name)}
      </a>
    `;
  }

  return html;
}


/* =======================================================
   CATEGORY NAVIGATION
======================================================= */

function setupCategoryNavigation() {

  const links =
    document.querySelectorAll(
      ".nav-category-link"
    );

  links.forEach((link) => {

    link.addEventListener("click", () => {
      closeMobileNavigation();
    });

  });
}


/* =======================================================
   FRAMEWORK NAVIGATION
======================================================= */

function setupFrameworkNavigation() {

  const links =
    document.querySelectorAll(
      ".framework-link"
    );

  links.forEach((link) => {

    link.addEventListener("click", () => {
      closeMobileNavigation();
    });

  });
}


/* =======================================================
   MOBILE NAVIGATION
======================================================= */

function setupMobileNavigation() {

  const menuToggle =
    document.getElementById("menuToggle");

  const mainNav =
    document.getElementById("mainNav");

  if (!menuToggle || !mainNav) {
    return;
  }


  if (
    menuToggle.dataset.navigationReady === "true"
  ) {
    return;
  }

  menuToggle.dataset.navigationReady = "true";


  /* ---------------------------------------------------
     HAMBURGER
  --------------------------------------------------- */

  menuToggle.addEventListener(
    "click",
    (event) => {

      event.preventDefault();
      event.stopPropagation();

      const isOpen =
        mainNav.classList.toggle("open");

      menuToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

      menuToggle.setAttribute(
        "aria-label",
        isOpen
          ? "Close navigation"
          : "Open navigation"
      );
    }
  );


  /* ---------------------------------------------------
     MOBILE DROPDOWNS
  --------------------------------------------------- */

  mainNav.addEventListener(
    "click",
    (event) => {

      if (window.innerWidth > 860) {
        return;
      }

      const sectionButton =
        event.target.closest(
          ".nav-section-button"
        );

      if (!sectionButton) {
        return;
      }


      const dropdown =
        sectionButton.closest(
          ".nav-dropdown"
        );

      if (!dropdown) {
        return;
      }


      /*
       * Framework dropdown.
       */

      if (
        sectionButton.classList.contains(
          "framework-nav-button"
        )
      ) {

        event.preventDefault();
        event.stopPropagation();

        toggleDropdown(
          dropdown,
          sectionButton
        );

        return;
      }


      /*
       * Normal catalogue dropdown.
       */

      const menu =
        dropdown.querySelector(
          ".dropdown-menu"
        );

      if (!menu) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      toggleDropdown(
        dropdown,
        sectionButton
      );
    }
  );
}


/* =======================================================
   TOGGLE DROPDOWN
======================================================= */

function toggleDropdown(
  dropdown,
  button
) {

  const isActive =
    dropdown.classList.toggle("active");

  button.setAttribute(
    "aria-expanded",
    String(isActive)
  );
}


/* =======================================================
   CLOSE MOBILE NAVIGATION
======================================================= */

function closeMobileNavigation() {

  const mainNav =
    document.getElementById("mainNav");

  const menuToggle =
    document.getElementById("menuToggle");

  if (mainNav) {

    mainNav.classList.remove("open");

    mainNav
      .querySelectorAll(".nav-dropdown")
      .forEach((dropdown) => {

        dropdown.classList.remove(
          "active"
        );
      });


    mainNav
      .querySelectorAll(".nav-section-button")
      .forEach((button) => {

        button.setAttribute(
          "aria-expanded",
          "false"
        );
      });

    /*
     * Do not manually set display.
     * CSS controls it.
     */
    mainNav.style.display = "";
  }


  if (menuToggle) {

    menuToggle.setAttribute(
      "aria-expanded",
      "false"
    );

    menuToggle.setAttribute(
      "aria-label",
      "Open navigation"
    );
  }
}


/* =======================================================
   HTML ESCAPING
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