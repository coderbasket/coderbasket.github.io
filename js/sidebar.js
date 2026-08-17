"use strict";

/* =======================================================
   Sidebar Component
   Manages Global Category Filtering (selectedCategoryId)
======================================================= */

document.addEventListener("catalogCategoriesLoaded", (event) => {
  const container = document.getElementById("categorySidebar");

  if (!container || typeof CATEGORIES === "undefined") {
    return;
  }

  const { categories } = event.detail || {};

  renderSidebar(container, categories);
  
  // Re-render on window resize if crossing the mobile/desktop breakpoint (768px)
  let lastIsMobile = window.innerWidth <= 768;
  window.addEventListener("resize", () => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile !== lastIsMobile) {
      lastIsMobile = isMobile;
      renderSidebar(container, categories);
    }
  });
});

/* =======================================================
   Render Sidebar (List for Desktop, Dropdown for Mobile)
======================================================= */

function renderSidebar(container, categoryIds) {
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    renderSidebarDropdown(container, categoryIds);
  } else {
    renderSidebarList(container, categoryIds);
  }
}

/* -------------------------------------------------------
   Desktop: Vertical List View
------------------------------------------------------- */

function renderSidebarList(container, categoryIds) {
  const isAllActive =
    typeof selectedCategoryId === "undefined" || selectedCategoryId === "all";

  let html = `
    <div class="sidebar-section">
      <h3 class="sidebar-title">Categories</h3>
      <ul class="sidebar-list" id="categoryList">
        <li>
          <button type="button" class="category-link ${isAllActive ? "active" : ""}" data-category-id="all">
            All Categories
          </button>
        </li>
  `;

  const validIds = [
    ...new Set(
      (categoryIds || [])
        .map(Number)
        .filter((id) => !isNaN(id) && CATEGORIES[id]),
    ),
  ];

  validIds.sort((a, b) => CATEGORIES[a].localeCompare(CATEGORIES[b]));

  for (const id of validIds) {
    const isSelected =
      typeof selectedCategoryId !== "undefined" &&
      selectedCategoryId !== "all" &&
      Number(selectedCategoryId) === id;

    html += `
      <li>
        <button type="button" class="category-link ${isSelected ? "active" : ""}" data-category-id="${id}">
          ${escapeHtml(CATEGORIES[id])}
        </button>
      </li>
    `;
  }

  html += `
      </ul>
    </div>
  `;

  container.innerHTML = html;
  setupSidebarListClick(container);
}

function setupSidebarListClick(container) {
  container.querySelectorAll(".category-link").forEach((button) => {
    button.addEventListener("click", () => {
      const rawValue = button.getAttribute("data-category-id");

      if (rawValue === "all") {
        selectedCategoryId = "all";
      } else {
        selectedCategoryId = Number(rawValue);
      }

      selectedSubCategory = "all";

      if (typeof saveSelection === "function") saveSelection();
      if (typeof currentPage !== "undefined") currentPage = 1;
      if (typeof renderSubCategories === "function") renderSubCategories();
      if (typeof applyFilters === "function") applyFilters();

      // Update active states in list
      container.querySelectorAll(".category-link").forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
    });
  });
}

/* -------------------------------------------------------
   Mobile: Dropdown View
------------------------------------------------------- */

function renderSidebarDropdown(container, categoryIds) {
  const isAllActive =
    typeof selectedCategoryId === "undefined" || selectedCategoryId === "all";

  let html = `
    <div class="category-dropdown-wrapper">
      <label for="categorySelect">Category Filter</label>
      <select id="categorySelect" class="category-select">
        <option value="all" ${isAllActive ? "selected" : ""}>All Categories</option>
  `;

  const validIds = [
    ...new Set(
      (categoryIds || [])
        .map(Number)
        .filter((id) => !isNaN(id) && CATEGORIES[id]),
    ),
  ];

  validIds.sort((a, b) => CATEGORIES[a].localeCompare(CATEGORIES[b]));

  for (const id of validIds) {
    const isSelected =
      typeof selectedCategoryId !== "undefined" &&
      selectedCategoryId !== "all" &&
      Number(selectedCategoryId) === id;

    html += `
      <option value="${id}" ${isSelected ? "selected" : ""}>
        ${escapeHtml(CATEGORIES[id])}
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

function setupSidebarDropdownChange(container) {
  const selectElement = container.querySelector("#categorySelect");
  if (!selectElement) return;

  selectElement.addEventListener("change", () => {
    const rawValue = selectElement.value;

    if (rawValue === "all") {
      selectedCategoryId = "all";
    } else {
      selectedCategoryId = Number(rawValue);
    }

    selectedSubCategory = "all";

    if (typeof saveSelection === "function") saveSelection();
    if (typeof currentPage !== "undefined") currentPage = 1;
    if (typeof renderSubCategories === "function") renderSubCategories();
    if (typeof applyFilters === "function") applyFilters();
  });
}

/* =======================================================
   HTML Escaping Helper
======================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}