"use strict";

/* =======================================================
   Sidebar Component
   Manages Global Category Filtering (selectedCategoryId)
======================================================= */

document.addEventListener("catalogCategoriesLoaded", (event) => {
  const sidebar =
    document.getElementById("categorySidebar") ||
    document.getElementById("categoryList");

  if (!sidebar || typeof CATEGORIES === "undefined") {
    return;
  }

  const { categories } = event.detail || {};

  renderSidebarCategories(sidebar, categories);
});

/* =======================================================
   Render Categories
======================================================= */

function renderSidebarCategories(container, categoryIds) {
  const isAllActive =
    typeof selectedCategoryId === "undefined" || selectedCategoryId === "all";

  let html = `
    <h2>Categories</h2>
    <div class="category-group">
      <button
        type="button"
        class="category-link ${isAllActive ? "active" : ""}"
        data-category-id="all"
      >
        All Categories
      </button>
  `;

  /* Normalize and deduplicate numeric category IDs */
  const validIds = [
    ...new Set(
      (categoryIds || [])
        .map(Number)
        .filter((id) => !isNaN(id) && CATEGORIES[id]),
    ),
  ];

  /* Sort category names alphabetically */
  validIds.sort((a, b) => CATEGORIES[a].localeCompare(CATEGORIES[b]));

  for (const id of validIds) {
    const isSelected =
      typeof selectedCategoryId !== "undefined" &&
      selectedCategoryId !== "all" &&
      Number(selectedCategoryId) === id;

    html += `
      <button
        type="button"
        class="category-link ${isSelected ? "active" : ""}"
        data-category-id="${id}"
      >
        ${escapeHtml(CATEGORIES[id])}
      </button>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;

  setupSidebarCategoryClicks(container);
}

/* =======================================================
   Event Listeners
======================================================= */

function setupSidebarCategoryClicks(container) {
  container.querySelectorAll(".category-link").forEach((button) => {
    button.addEventListener("click", () => {
      const rawValue = button.dataset.categoryId;

      /* 1. Update Global Category Filter state */
      if (rawValue === "all") {
        selectedCategoryId = "all";
      } else {
        selectedCategoryId = Number(rawValue);
      }

      /* 2. Clear sub-category filter to avoid zero-result intersection conflicts */
      selectedSubCategory = "all";

      /* 3. Persist updated selections */
      if (typeof saveSelection === "function") {
        saveSelection();
      }

      /* 4. Reset pagination */
      if (typeof currentPage !== "undefined") {
        currentPage = 1;
      }

      /* 5. Update sub-category UI in app.js if present */
      if (typeof renderSubCategories === "function") {
        renderSubCategories();
      }

      /* 6. Trigger filter pipeline */
      if (typeof applyFilters === "function") {
        applyFilters();
      }

      /* 7. Synchronize active state styles */
      container.querySelectorAll(".category-link").forEach((link) => {
        const itemVal = link.dataset.categoryId;
        const isActive =
          itemVal === "all"
            ? selectedCategoryId === "all"
            : Number(selectedCategoryId) === Number(itemVal);

        link.classList.toggle("active", isActive);
      });
    });
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