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

    html += `
    <div class="nav-dropdown">

        <button
            type="button"
            class="nav-section-button"
        >
            ${escapeHtml(section.name)}
        </button>

        <div class="dropdown-menu">

            <button
                type="button"
                class="nav-category-button nav-all-button"
                data-section="${escapeAttribute(sectionKey)}"
                data-category="all"
            >
                ${escapeHtml(section.name)} (All)
            </button>
`;

    if (section.categories) {
      for (const [categoryKey, categoryName] of Object.entries(
        section.categories,
      )) {
        html += `
                    <button
                        type="button"
                        class="nav-category-button"
                        data-section="${escapeAttribute(sectionKey)}"
                        data-category="${escapeAttribute(categoryKey)}"
                    >
                        ${escapeHtml(categoryName)}
                    </button>
            `;
      }
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

    for (const framework of Object.values(FRAMEWORKS)) {
      html += `
                <a href="${escapeAttribute(framework.path)}">
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
        Main navigation
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
        Insert
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
  console.log("[HeaderNav] Initializing setupCategoryNavigation()...");

  const buttons = document.querySelectorAll(".nav-category-button");

  if (buttons.length === 0) {
    console.warn("[HeaderNav] No '.nav-category-button' elements found.");
    return;
  }

  buttons.forEach((button, index) => {
    button.addEventListener("click", async () => {
      const sectionKey = button.dataset.section;
      const categoryKey = button.dataset.category || "all";

      console.log(`[HeaderNav] Clicked dropdown item #${index + 1}:`, {
        sectionKey,
        categoryKey,
      });

      /* -------------------------------------------------
         Validate section
      ------------------------------------------------- */

      const section = DATA_SECTIONS[sectionKey];

      if (!section) {
        console.warn(
          `[HeaderNav] Section '${sectionKey}' not in DATA_SECTIONS.`,
        );
        return;
      }

      /* -------------------------------------------------
         Validate Sub-Category Key
      ------------------------------------------------- */

      if (
        categoryKey !== "all" &&
        (!section.categories ||
          !Object.prototype.hasOwnProperty.call(
            section.categories,
            categoryKey,
          ))
      ) {
        console.warn(
          `[HeaderNav] Category '${categoryKey}' not found in section '${sectionKey}'.`,
        );
        return;
      }

      /* -------------------------------------------------
         Detect whether a new section must be loaded
      ------------------------------------------------- */

      const needsReload =
        typeof selectedSection === "undefined" ||
        selectedSection !== sectionKey ||
        typeof allProjects === "undefined" ||
        allProjects.length === 0 ||
        allProjects[0]?.data_section !== sectionKey;

      /* -------------------------------------------------
         Assign to synchronized 3-filter state
      ------------------------------------------------- */

      selectedSection = sectionKey;
      selectedSubCategory = categoryKey;
      selectedCategoryId = "all"; // Reset global numeric topic filter when selecting via sub-category menu

      console.log("[HeaderNav] Synchronized state:", {
        selectedSection,
        selectedSubCategory,
        selectedCategoryId,
      });

      /* -------------------------------------------------
         Save selection to LocalStorage
      ------------------------------------------------- */

      if (typeof saveSelection === "function") {
        saveSelection();
      }

      /* -------------------------------------------------
         Reset pagination
      ------------------------------------------------- */

      if (typeof currentPage !== "undefined") {
        currentPage = 1;
      }

      /* -------------------------------------------------
         Load section or filter existing projects
      ------------------------------------------------- */

      if (needsReload && typeof loadCatalog === "function") {
        console.log(
          `[HeaderNav] Section changed to '${sectionKey}'. Loading catalog...`,
        );

        await loadCatalog();
      } else {
        console.log(
          "[HeaderNav] Section unchanged. Updating sidebar & applying filters...",
        );

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

  console.log("[HeaderNav] Listeners successfully attached.");
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

  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
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