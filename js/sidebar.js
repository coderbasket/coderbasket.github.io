"use strict";

/* =======================================================
   Sidebar Component
   Global Category Filtering
======================================================= */

/* =======================================================
   Auto-load Sidebar CSS
======================================================= */

(() => {
  const href = "/css/sidebar.css";

  if (!document.querySelector(`link[href="${href}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }
})();

/* =======================================================
   Read category selection safely
======================================================= */

function getSelectedCategory() {
  return typeof window.selectedCategoryId !== "undefined"
    ? window.selectedCategoryId
    : "all";
}

/*
 * IMPORTANT:
 *
 * app.js currently declares:
 *
 * let selectedCategoryId = "all";
 *
 * A top-level `let` is NOT available as window.selectedCategoryId.
 *
 * Therefore sidebar.js must not directly reference it.
 *
 * We communicate through events instead.
 */

/* =======================================================
   Category Sidebar Event
======================================================= */

document.addEventListener("catalogCategoriesLoaded", (event) => {
  const container = document.getElementById("categorySidebar");

  if (!container) {
    return;
  }

  const categories = event.detail?.categories || [];

  console.log("[Sidebar] Dynamic sidebar detected.");
  console.log("[Sidebar] Rendering:", categories);

  renderCategorySidebar(container, categories);
});

/* =======================================================
   Main Renderer
======================================================= */

function renderCategorySidebar(container, categories) {
  if (!container) {
    return;
  }

  const normalizedCategories = normalizeCategories(categories);

  console.log("[Sidebar] Normalized categories:", normalizedCategories);

  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    renderSidebarDropdown(container, normalizedCategories);
  } else {
    renderSidebarDesktop(container, normalizedCategories);
  }
}

/* =======================================================
   Normalize categories
======================================================= */

function normalizeCategories(categories) {
  return [
    ...new Set(
      (Array.isArray(categories) ? categories : [])
        .map((category) => String(category ?? "").trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

/* =======================================================
   Desktop
======================================================= */

function renderSidebarDesktop(container, categories) {
  const selectedCategory = getSelectedCategory();

  const isAllActive =
    selectedCategory === "all" ||
    selectedCategory === undefined ||
    selectedCategory === null ||
    selectedCategory === "";

  const MANY_CATEGORIES_THRESHOLD = 12;

  if (categories.length >= MANY_CATEGORIES_THRESHOLD) {
    renderSidebarGrid(container, categories, isAllActive);
  } else {
    renderSidebarNormalList(container, categories, isAllActive);
  }
}

/* =======================================================
   Normal Desktop List
======================================================= */

function renderSidebarNormalList(container, categories, isAllActive) {
  let html = `
    <div class="sidebar-section">

      <h3 class="sidebar-title">
        Categories
      </h3>

      <div class="sidebar-list" id="categoryList">

        <button
          type="button"
          class="category-link ${isAllActive ? "active" : ""}"
          data-category-id="all">
          All Categories
        </button>
  `;

  const selectedCategory = getSelectedCategory();

  for (const category of categories) {
    const isSelected =
      !isAllActive &&
      String(selectedCategory).trim().toLowerCase() ===
        String(category).trim().toLowerCase();

    html += `
      <button
        type="button"
        class="category-link ${isSelected ? "active" : ""}"
        data-category-id="${escapeAttribute(category)}">
        ${escapeHtml(category)}
      </button>
    `;
  }

  html += `
      </div>

    </div>
  `;

  container.innerHTML = html;

  setupSidebarListClick(container);
}

/* =======================================================
   Desktop Grid / Pagination
======================================================= */

function renderSidebarGrid(container, categories, isAllActive) {
  const PAGE_SIZE = 10;

  let page = Number(container.dataset.categoryPage || 0);

  const totalPages = Math.ceil(categories.length / PAGE_SIZE);

  if (page >= totalPages) {
    page = Math.max(0, totalPages - 1);
  }

  container.dataset.categoryPage = page;

  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  const visibleCategories = categories.slice(start, end);

  const selectedCategory = getSelectedCategory();

  let html = `
    <div class="sidebar-section">

      <h3 class="sidebar-title">
        Categories
      </h3>

      <div class="sidebar-list" id="categoryList">

        <button
          type="button"
          class="category-link ${isAllActive ? "active" : ""}"
          data-category-id="all">
          All Categories
        </button>
  `;

  for (const category of visibleCategories) {
    const isSelected =
      !isAllActive &&
      String(selectedCategory).trim().toLowerCase() ===
        String(category).trim().toLowerCase();

    html += `
      <button
        type="button"
        class="category-link ${isSelected ? "active" : ""}"
        data-category-id="${escapeAttribute(category)}">
        ${escapeHtml(category)}
      </button>
    `;
  }

  html += `
      </div>
  `;

  if (totalPages > 1) {
    html += `
      <div class="category-pagination">
    `;

    if (page > 0) {
      html += `
        <button
          type="button"
          class="category-page-button"
          data-category-page="${page - 1}">
          ← Previous
        </button>
      `;
    }

    if (page < totalPages - 1) {
      html += `
        <button
          type="button"
          class="category-page-button"
          data-category-page="${page + 1}">
          Next →
        </button>
      `;
    }

    html += `
      </div>
    `;
  }

  html += `
    </div>
  `;

  container.innerHTML = html;

  setupSidebarListClick(container);
  setupCategoryPagination(container, categories, isAllActive);
}

/* =======================================================
   Pagination
======================================================= */

function setupCategoryPagination(container, categories, isAllActive) {
  container.querySelectorAll(".category-page-button").forEach((button) => {
    button.addEventListener("click", () => {
      const page = Number(button.getAttribute("data-category-page"));

      container.dataset.categoryPage = page;

      renderSidebarGrid(container, categories, isAllActive);
    });
  });
}

/* =======================================================
   Category Click
======================================================= */

function setupSidebarListClick(container) {
  container.querySelectorAll(".category-link").forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.getAttribute("data-category-id");

      console.log("[Sidebar] Category selected:", value);

      /*
       * Do NOT use Number(value).
       *
       * Categories are now names:
       *
       * "API"
       * "Backend"
       * "Developer Tools"
       * "Web Development"
       */

      if (value === "all") {
        setCategorySelection("all");
      } else {
        setCategorySelection(value);
      }

      container
        .querySelectorAll(".category-link")
        .forEach((btn) => btn.classList.remove("active"));

      button.classList.add("active");

      scrollCatalogueToTop();
    });
  });
}

/* =======================================================
   Category Selection Bridge
======================================================= */

function setCategorySelection(value) {
  console.log("[Sidebar] Applying category filter:", value);

  /*
   * app.js and sidebar.js are loaded on the same page,
   * so call applyFilters() directly.
   */

  if (typeof applyFilters === "function") {
    selectedCategory = value;
    applyFilters();
    return;
  }

  console.error("[Sidebar] applyFilters() is not available.");
}

/* =======================================================
   Mobile Dropdown
======================================================= */

function renderSidebarDropdown(container, categories) {
  const selectedCategory = getSelectedCategory();

  const isAllActive = selectedCategory === "all";

  let html = `
    <div class="category-dropdown-wrapper">

      <label for="categorySelect">
        Category Filter
      </label>

      <select
        id="categorySelect"
        class="category-select">

        <option
          value="all"
          ${isAllActive ? "selected" : ""}>
          All Categories
        </option>
  `;

  for (const category of categories) {
    const isSelected =
      !isAllActive &&
      String(selectedCategory).trim().toLowerCase() ===
        String(category).trim().toLowerCase();

    html += `
      <option
        value="${escapeAttribute(category)}"
        ${isSelected ? "selected" : ""}>
        ${escapeHtml(category)}
      </option>
    `;
  }

  html += `
      </select>

    </div>
  `;

  container.innerHTML = html;

  setupSidebarDropdownChange(container);
}

/* =======================================================
   Mobile Selection
======================================================= */

function setupSidebarDropdownChange(container) {
  const select = container.querySelector("#categorySelect");

  if (!select) {
    return;
  }

  select.addEventListener("change", () => {
    const value = select.value;

    console.log("[Sidebar] Dropdown category selected:", value);

    setCategorySelection(value);
  });
}

/* =======================================================
   Resize
======================================================= */

let sidebarLastIsMobile = window.innerWidth <= 768;

window.addEventListener("resize", () => {
  const isMobile = window.innerWidth <= 768;

  if (isMobile === sidebarLastIsMobile) {
    return;
  }

  sidebarLastIsMobile = isMobile;

  const container = document.getElementById("categorySidebar");

  if (!container) {
    return;
  }

  /*
   * Re-render using the last loaded categories.
   */
  const categories = container._catalogCategories || [];

  renderCategorySidebar(container, categories);
});

/* =======================================================
   Store categories for resize rendering
======================================================= */

document.addEventListener("catalogCategoriesLoaded", (event) => {
  const container = document.getElementById("categorySidebar");

  if (!container) {
    return;
  }

  container._catalogCategories = normalizeCategories(
    event.detail?.categories || [],
  );
});

/* =======================================================
   Scroll Catalogue
======================================================= */

function scrollCatalogueToTop() {
  const projectGrid = document.getElementById("projectGrid");

  if (projectGrid) {
    projectGrid.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  } else {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
}

/* =======================================================
   HTML Escaping
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
