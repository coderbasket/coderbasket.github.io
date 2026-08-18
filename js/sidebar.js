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

/* -------------------------------------------------------
   Desktop: Compact Category Grid
------------------------------------------------------- */

function renderSidebarList(container, categoryIds) {
  const isAllActive =
    typeof selectedCategoryId === "undefined" || selectedCategoryId === "all";

  const validIds = [
    ...new Set(
      (categoryIds || [])
        .map(Number)
        .filter((id) => !isNaN(id) && CATEGORIES[id]),
    ),
  ];

  validIds.sort((a, b) => CATEGORIES[a].localeCompare(CATEGORIES[b]));

  // Show grid only when there are many categories.
  const MANY_CATEGORIES_THRESHOLD = 12;
  const useGrid = validIds.length >= MANY_CATEGORIES_THRESHOLD;

  if (useGrid) {
    renderSidebarGrid(container, validIds, isAllActive);
  } else {
    renderSidebarNormalList(container, validIds, isAllActive);
  }

  setupSidebarListClick(container);
}

function renderSidebarNormalList(container, validIds, isAllActive) {
  let html = `
    <div class="sidebar-section">
      <h3 class="sidebar-title">Categories</h3>

      <div class="sidebar-list" id="categoryList">

        <button
          type="button"
          class="category-link ${isAllActive ? "active" : ""}"
          data-category-id="all">
          All Categories
        </button>
  `;

  for (const id of validIds) {
    const isSelected =
      typeof selectedCategoryId !== "undefined" &&
      selectedCategoryId !== "all" &&
      Number(selectedCategoryId) === id;

    html += `
        <button
          type="button"
          class="category-link ${isSelected ? "active" : ""}"
          data-category-id="${id}">
          ${escapeHtml(CATEGORIES[id])}
        </button>
    `;
  }

  html += `
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function renderSidebarGrid(container, validIds, isAllActive) {
  const PAGE_SIZE = 10;

  // Store the current category page on the container.
  let page = Number(container.dataset.categoryPage || 0);

  const totalPages = Math.ceil(validIds.length / PAGE_SIZE);

  if (page >= totalPages) {
    page = Math.max(0, totalPages - 1);
  }

  container.dataset.categoryPage = page;

  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  const visibleIds = validIds.slice(start, end);

  let html = `
    <div class="sidebar-section">
      <h3 class="sidebar-title">Categories</h3>

      <div class="sidebar-list" id="categoryList">

        <button
          type="button"
          class="category-link ${isAllActive ? "active" : ""}"
          data-category-id="all">
          All Categories
        </button>
  `;

  for (const id of visibleIds) {
    const isSelected =
      typeof selectedCategoryId !== "undefined" &&
      selectedCategoryId !== "all" &&
      Number(selectedCategoryId) === id;

    html += `
        <button
          type="button"
          class="category-link ${isSelected ? "active" : ""}"
          data-category-id="${id}">
          ${escapeHtml(CATEGORIES[id])}
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
  setupCategoryPagination(container, validIds, isAllActive);
}
function setupCategoryPagination(container, validIds, isAllActive) {
  container
    .querySelectorAll(".category-page-button")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const page = Number(
          button.getAttribute("data-category-page")
        );

        container.dataset.categoryPage = page;

        renderSidebarGrid(
          container,
          validIds,
          isAllActive
        );

        // Keep the sidebar at the top after changing category page.
        container.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
}
function setupSidebarListClick(container) {
  container.querySelectorAll(".category-grid-button").forEach((button) => {
    button.addEventListener("click", () => {
      const rawValue = button.getAttribute("data-category-id");

      if (rawValue === "all") {
        selectedCategoryId = "all";
      } else {
        selectedCategoryId = Number(rawValue);
      }

      selectedSubCategory = "all";

      if (typeof saveSelection === "function") {
        saveSelection();
      }

      if (typeof currentPage !== "undefined") {
        currentPage = 1;
      }

      if (typeof renderSubCategories === "function") {
        renderSubCategories();
      }

      if (typeof applyFilters === "function") {
        applyFilters();
      }

      // Update active state.
      container.querySelectorAll(".category-grid-button").forEach((btn) => {
        btn.classList.remove("active");
      });

      button.classList.add("active");

      // Scroll catalogue back to the top.
      scrollCatalogueToTop();
    });
  });
}

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
      container
        .querySelectorAll(".category-link")
        .forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
    });
  });
}

function setupCategoryMoreButton(container) {
  const moreButton = container.querySelector("#categoryMoreButton");
  const moreList = container.querySelector("#categoryMoreList");

  if (!moreButton || !moreList) return;

  moreButton.addEventListener("click", () => {
    const isHidden = moreList.hidden;

    moreList.hidden = !isHidden;

    if (isHidden) {
      moreButton.textContent = "Show less";
    } else {
      moreButton.textContent = `+${moreList.querySelectorAll(".category-link").length} more`;
    }
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
