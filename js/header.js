"use strict";

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

  if (NAVIGATION.home) {
    html += `
            <a href="${escapeAttribute(NAVIGATION.home.path)}">
                ${escapeHtml(NAVIGATION.home.name)}
            </a>
        `;
  }

  /* ---------------------------------------------------
        Catalogue sections
    --------------------------------------------------- */

  for (const sectionKey of DATA_SECTION_ORDER) {
    const section = DATA_SECTIONS[sectionKey];

    if (!section) {
      continue;
    }

    const sectionPath = section.path || `/${sectionKey}/`;

    if (!section.categories) {
      html += `
            <a href="${escapeAttribute(sectionPath)}">
                ${escapeHtml(section.name)}
            </a>
        `;
      continue;
    }

    html += `
    <div class="nav-dropdown">

        <a
            class="nav-section-button"
            href="${escapeAttribute(sectionPath)}"
        >
            ${escapeHtml(section.name)}
        </a>

        <div class="dropdown-menu">

            <a
                class="nav-category-link nav-all-button"
                href="${escapeAttribute(sectionPath)}"
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
                    href="${escapeAttribute(`${sectionPath}${categoryKey}/`)}"
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

  /* ---------------------------------------------------
        Frameworks
    --------------------------------------------------- */

  if (typeof FRAMEWORKS !== "undefined" && FRAMEWORKS) {
    html += `
        <div class="nav-dropdown">

            <button
                type="button"
                class="nav-section-button"
            >
                Frameworks
            </button>

            <div class="framework-dropdown-menu">
    `;

    for (const [frameworkKey, framework] of Object.entries(FRAMEWORKS)) {
      const frameworkPath = framework.path || `/${frameworkKey}/`;

      html += `
                <a href="${escapeAttribute(frameworkPath)}">
                    ${escapeHtml(framework.name)}
                </a>
        `;
    }

    html += `
            </div>

        </div>
    `;
  }

  /* ---------------------------------------------------
        Main navigation links
    --------------------------------------------------- */

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

  /* ---------------------------------------------------
        Insert into DOM
    --------------------------------------------------- */

  mainNav.innerHTML = html;

  /* ---------------------------------------------------
        Setup interactions
    --------------------------------------------------- */

  setupCategoryNavigation();
  setupMobileNavigation();
}

/* =======================================================
   Catalogue navigation
======================================================= */

function setupCategoryNavigation() {
  const buttons = document.querySelectorAll(".nav-category-button");

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const sectionKey = button.dataset.section;
      const categoryKey = button.dataset.category || "all";

      const section = DATA_SECTIONS[sectionKey];

      if (!section) {
        return;
      }

      if (
        categoryKey !== "all" &&
        (!section.categories ||
          !Object.prototype.hasOwnProperty.call(
            section.categories,
            categoryKey,
          ))
      ) {
        return;
      }

      const needsReload =
        typeof selectedSection === "undefined" ||
        selectedSection !== sectionKey ||
        typeof allProjects === "undefined" ||
        allProjects.length === 0 ||
        allProjects[0]?.data_section !== sectionKey;

      selectedSection = sectionKey;
      selectedSubCategory = categoryKey;
      selectedCategoryId = "all";

      if (typeof saveSelection === "function") {
        saveSelection();
      }

      if (typeof currentPage !== "undefined") {
        currentPage = 1;
      }

      if (needsReload && typeof loadCatalog === "function") {
        await loadCatalog();
      } else {
        if (typeof renderSections === "function") renderSections();
        if (typeof renderSubCategories === "function") renderSubCategories();
        if (typeof renderCategories === "function") renderCategories();

        if (typeof applyFilters === "function") {
          applyFilters();
        }
      }

      closeMobileNavigation();
    });
  });
}

/* =======================================================
   Mobile navigation interactions
======================================================= */
/* =======================================================
   Mobile navigation interactions
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

  /* =====================================================
     MAIN HAMBURGER
     ===================================================== */

  menuToggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isOpen = mainNav.style.display !== "flex";

    mainNav.style.display = isOpen ? "flex" : "none";

    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  /* =====================================================
     MOBILE DROPDOWNS
     ===================================================== */

  mainNav.addEventListener("click", (e) => {
    if (window.innerWidth > 860) {
      return;
    }

    const sectionButton = e.target.closest(".nav-section-button");

    if (!sectionButton) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const dropdown = sectionButton.closest(".nav-dropdown");

    if (!dropdown) {
      return;
    }

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

    mainNav.querySelectorAll(".nav-dropdown").forEach((dropdown) => {
      dropdown.classList.remove("active");
    });
  }

  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", "false");
  }
}

/* =======================================================
   HTML escaping helpers
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
