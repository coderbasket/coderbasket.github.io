"use strict";

/*
 * Coder Basket
 * Static catalogue application
 *
 * Architecture:
 *   allProjects
 *        |
 *        +---- 1. section filter (selectedSection)
 *        +---- 2. sub-category filter (selectedSubCategory)
 *        +---- 3. category filter (selectedCategoryId)
 *        +---- 4. search filter (searchText)
 *                 |
 *                 v
 *          filteredProjects
 *                 |
 *                 v
 *            project cards
 */

//#region Debug
const DEBUG = true;

function log(method, ...args) {
  if (DEBUG) {
    console.log(`[${method}]`, ...args);
  }
}

function warn(method, ...args) {
  console.warn(`[${method}]`, ...args);
}

function error(method, ...args) {
  console.error(`[${method}]`, ...args);
}
//#endregion

//#region Application State

let allProjects = [];
let filteredProjects = [];

// Distinct Filter State Variables
let selectedSection = DEFAULT_SECTION;
let selectedSubCategory = "all";
let selectedCategoryId = "all";

let currentPage = 1;
const PAGE_SIZE = 24;

//#endregion

//#region DOM Cache Variables

let projectGrid;
let loading;
let loadMoreButton;

let searchInput;
let searchButton;
let sortSelect;

let sectionList;
let subCategoryList;
let categoryList;

let menuToggle;
let mainNav;
let yearElement;

//#endregion

//#region Initialization

async function initialize() {
  log("initialize", "Starting application");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  restoreSelection();

  log("initialize", "Restored state:", {
    selectedSection,
    selectedSubCategory,
    selectedCategoryId,
  });

  setupNavigation();
  setupSearch();
  setupSorting();

  renderSections();
  renderSubCategories();
  renderCategories();

  await loadCatalog();

  log("initialize", "Application initialization complete");
}

//#endregion

//#region Selection State Persistence

function restoreSelection() {
  log("restoreSelection", "Reading URL selection");

  /*
   * URL examples:
   *
   * /
   * /index.html
   *     -> default section
   *
   * /ai/
   * /ai/index.html
   *     -> section = ai
   *
   * /ai/agents/
   * /ai/agents/index.html
   *     -> section = ai
   *        subCategory = agents
   *
   * /ai/agents/index.html?category=12
   *     -> section = ai
   *        subCategory = agents
   *        category = 12
   */

  let path = window.location.pathname.replace(/^\/+|\/+$/g, "");

  /*
   * Remove index.html because it is the physical page,
   * not part of our catalogue hierarchy.
   */
  if (path.toLowerCase() === "index.html") {
    path = "";
  } else if (path.toLowerCase().endsWith("/index.html")) {
    path = path.slice(0, -"/index.html".length);
  }

  const parts = path ? path.split("/").filter(Boolean) : [];

  const urlSection = parts[0] || null;
  const urlSubCategory = parts[1] || null;

  const params = new URLSearchParams(window.location.search);
  const urlCategory = params.get("category");

  /*
   * -------------------------------------------------------
   * 1. URL SECTION
   * -------------------------------------------------------
   */

  const configuredPageSection =
    typeof window.CODER_BASKET_SECTION === "string"
      ? window.CODER_BASKET_SECTION
      : null;

  const candidateSection = urlSection || configuredPageSection;

  if (
    candidateSection &&
    (candidateSection === "all" ||
      DATA_SECTIONS[candidateSection] ||
      (typeof FRAMEWORKS !== "undefined" && FRAMEWORKS[candidateSection]))
  ) {
    selectedSection = candidateSection;
  } else {
    selectedSection = DEFAULT_SECTION;
  }

  /*
   * -------------------------------------------------------
   * 2. URL SUB-CATEGORY
   * -------------------------------------------------------
   */

  if (urlSubCategory) {
    selectedSubCategory = String(urlSubCategory);
  } else {
    selectedSubCategory = "all";
  }

  /*
   * -------------------------------------------------------
   * 3. URL CATEGORY PARAMETER
   * -------------------------------------------------------
   */

  if (
    urlCategory === "all" ||
    (urlCategory !== null && CATEGORIES[Number(urlCategory)])
  ) {
    selectedCategoryId = urlCategory === "all" ? "all" : Number(urlCategory);
  } else {
    selectedCategoryId = "all";
  }

  log("restoreSelection", "URL state:", {
    originalPath: window.location.pathname,
    normalizedPath: path,
    urlSection,
    urlSubCategory,
    urlCategory,
    selectedSection,
    selectedSubCategory,
    selectedCategoryId,
  });
}

function saveSelection() {
  log("saveSelection", {
    selectedSection,
    selectedSubCategory,
    selectedCategoryId,
  });

  localStorage.setItem(STORAGE_KEYS.section, selectedSection);
  localStorage.setItem(STORAGE_KEYS.subCategory, selectedSubCategory);
  localStorage.setItem(STORAGE_KEYS.category, String(selectedCategoryId));
}

//#endregion

//#region Catalogue Loading

async function loadCatalog() {
  log("loadCatalog", "START", {
    selectedSection,
    selectedSubCategory,
    selectedCategoryId,
  });

  showLoading(true);

  try {
    const sectionsToLoad =
      selectedSection === "all" ? DATA_SECTION_ORDER : [selectedSection];

    log("loadCatalog", "Sections to load:", sectionsToLoad);

    const requests = sectionsToLoad.map((sectionKey) =>
      loadCatalogSection(sectionKey),
    );

    const results = await Promise.allSettled(requests);
    const projects = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        projects.push(...result.value);
      } else {
        warn(
          "loadCatalog",
          "Unable to load catalogue source:",
          result.reason,
        );
      }
    }

    allProjects = normalizeProjects(projects);

    notifyCategories();
    renderSubCategories();
    renderCategories();

    applyFilters();

    log("loadCatalog", "END", {
      selectedSection,
      selectedSubCategory,
      selectedCategoryId,
      allProjects: allProjects.length,
      filteredProjects: filteredProjects.length,
    });
  } catch (errorValue) {
    error("loadCatalog", "Coder Basket catalogue failed:", errorValue);
    showError("Unable to load the Coder Basket catalogue. Please try again.");
  } finally {
    showLoading(false);
  }
}

async function loadCatalogSection(sectionKey) {
  const sourceSectionKey = getDataSourceSectionKey(sectionKey);
  const section = DATA_SECTIONS[sourceSectionKey];

  if (!section) {
    warn("loadCatalogSection", `Unknown catalogue section: ${sectionKey}`);
    return [];
  }

  const fileName = section.file || `${sourceSectionKey}.json`;
  const url = `${DATA_BASE_URL}${fileName}`;

  try {
    const response = await fetch(url);

    if (response.status === 404 || !response.ok) {
      warn("loadCatalogSection", `Unable to load source: ${url}`);
      return [];
    }

    const text = await response.text();
    if (!text.trim()) return [];

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      error("loadCatalogSection", `Invalid JSON in ${url}`, parseError);
      return [];
    }

    const items = Array.isArray(data)
      ? data
      : Array.isArray(data.Items)
        ? data.Items
        : [];

    var finalItems = items.map((item) => ({
      ...item,
      source_section: sourceSectionKey,
      data_section: item.section || item.data_section || item.DataSection || sectionKey,
      data_category:
        item.section_category ||
        item.data_category ||
        item.DataCategory ||
        "all",
    }));
    return finalItems;
  } catch (errorValue) {
    error(
      "loadCatalogSection",
      `Unable to load catalogue source: ${url}`,
      errorValue,
    );
    return [];
  }
}

function getDataSourceSectionKey(sectionKey) {
  if (DATA_SECTIONS[sectionKey]) {
    return sectionKey;
  }

  if (typeof FRAMEWORKS !== "undefined" && FRAMEWORKS[sectionKey]) {
    return "frameworks";
  }

  return sectionKey;
}

//#endregion

//#region Data Normalization

function normalizeProjects(projects) {
  return projects.map((project) => {
    const rawCategories =
      Array.isArray(project.categories)
        ? project.categories
        : Array.isArray(project.Categories)
          ? project.Categories
          : [];

    const categories =
      rawCategories.length > 0
        ? [...new Set(rawCategories)]
        : [41];

    const platforms = Array.isArray(project.platforms)
      ? [...new Set(project.platforms)]
      : Array.isArray(project.Platforms)
        ? [...new Set(project.Platforms)]
        : [];

    const technologies = Array.isArray(project.technologies)
      ? [...new Set(project.technologies)]
      : Array.isArray(project.Technologies)
        ? [...new Set(project.Technologies)]
        : project.technology
          ? [project.technology]
          : project.framework_name
            ? [project.framework_name]
            : [];

    let imageUrls = [];
    if (project.image_url) {
      imageUrls = [project.image_url];
    } else if (Array.isArray(project.ImageUrls)) {
      imageUrls = project.ImageUrls.filter(Boolean);
    } else if (Array.isArray(project.image_urls)) {
      imageUrls = project.image_urls.filter(Boolean);
    }

    const dataCategory = project.data_category || project.DataCategory || "";

    if (imageUrls.length === 0 && typeof getCategoryIcon === "function") {
      const categoryIcon = getCategoryIcon(dataCategory);
      if (categoryIcon) {
        imageUrls = [categoryIcon];
      }
    }

    return {
      project_url: project.project_url || project.ProjectUrl || "",
      title: project.title || project.Title || "Untitled Project",
      description:
        project.description ||
        project.Description ||
        "No description available.",
      platforms,
      external_url: project.external_url ?? project.ExternalUrl ?? null,
      youtube_url: project.youtube_url ?? project.YoutubeUrl ?? null,
      technologies,
      framework_name:
        technologies[0] ||
        project.framework_name ||
        project.FrameWorkName ||
        "others",
      categories,
      image_urls: imageUrls,
      data_section:
        project.section || project.data_section || project.DataSection || "",
      data_category:
        project.section_category || dataCategory || "all",
      source_section: project.source_section || "",
      updated_at:
        project.updated_at || project.updated || project.UpdatedAt || null,
    };
  });
}

//#endregion

//#region Event Dispatcher

function notifyCategories() {
  const categoryIds = [
    ...new Set(
      allProjects.flatMap((project) =>
        Array.isArray(project.categories) ? project.categories : [],
      ),
    ),
  ]
    .map(Number)
    .filter(
      (id) => !isNaN(id) && typeof CATEGORIES !== "undefined" && CATEGORIES[id],
    );

  document.dispatchEvent(
    new CustomEvent("catalogCategoriesLoaded", {
      detail: { categories: categoryIds },
    }),
  );
}

//#endregion

//#region Sidebar Renderers

function renderSections() {
  if (!sectionList) return;
  sectionList.innerHTML = "";

  addFilterLink(
    sectionList,
    "All",
    "all",
    selectedSection === "all",
    "section",
  );

  for (const sectionKey of DATA_SECTION_ORDER) {
    const section = DATA_SECTIONS[sectionKey];
    if (!section) continue;

    addFilterLink(
      sectionList,
      section.name,
      sectionKey,
      selectedSection === sectionKey,
      "section",
    );
  }
}

function renderSubCategories() {
  if (!subCategoryList) return;
  subCategoryList.innerHTML = "";

  addFilterLink(
    subCategoryList,
    "All Sub-Categories",
    "all",
    selectedSubCategory === "all",
    "subcategory",
  );

  const subCategories = new Set();
  for (const project of allProjects) {
    if (project.data_category) {
      subCategories.add(project.data_category);
    }
  }

  for (const subCatKey of [...subCategories].sort()) {
    addFilterLink(
      subCategoryList,
      subCatKey,
      subCatKey,
      selectedSubCategory === subCatKey,
      "subcategory",
    );
  }
}

function renderCategories() {
  if (!categoryList) return;
  categoryList.innerHTML = "";

  addFilterLink(
    categoryList,
    "All Categories",
    "all",
    selectedCategoryId === "all",
    "category",
  );

  const categoryIds = new Set();
  for (const project of allProjects) {
    if (!Array.isArray(project.categories)) continue;

    for (const categoryId of project.categories) {
      const id = Number(categoryId);
      if (typeof CATEGORIES !== "undefined" && CATEGORIES[id]) {
        categoryIds.add(id);
      }
    }
  }

  const sortedCategories = [...categoryIds].sort((a, b) =>
    (CATEGORIES[a] || "").localeCompare(CATEGORIES[b] || ""),
  );

  for (const categoryId of sortedCategories) {
    const isSelected =
      selectedCategoryId !== "all" && Number(selectedCategoryId) === categoryId;

    addFilterLink(
      categoryList,
      CATEGORIES[categoryId],
      String(categoryId),
      isSelected,
      "category",
    );
  }
}

//#endregion

//#region Filter Links Handler

function addFilterLink(container, text, value, active, type) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "category-link";
  if (active) button.classList.add("active");
  button.textContent = text;

  button.addEventListener("click", async () => {
    log("addFilterLink", "CLICK", { type, text, value });

    /* 1. SECTION FILTER LINK CLICK */
    if (type === "section") {
      selectedSection = value;
      selectedSubCategory = "all";
      selectedCategoryId = "all";

      saveSelection();
      currentPage = 1;

      renderSections();
      await loadCatalog();
      return;
    }

    /* 2. SUB-CATEGORY (FILE KEY) LINK CLICK */
    if (type === "subcategory") {
      selectedSubCategory = value === "all" ? "all" : String(value);
      saveSelection();
      currentPage = 1;

      renderSubCategories();
      applyFilters();
      return;
    }

    /* 3. GLOBAL CATEGORY NUMERIC ID LINK CLICK */
    if (type === "category") {
      selectedCategoryId = value === "all" ? "all" : Number(value);
      saveSelection();
      currentPage = 1;

      renderCategories();
      applyFilters();
      return;
    }
  });

  container.appendChild(button);
}

//#endregion

//#region Search Handling

function setupSearch() {
  if (!searchInput) return;

  searchInput.addEventListener("input", () => applyFilters());
  if (searchButton) {
    searchButton.addEventListener("click", () => applyFilters());
  }
}

function getSearchText() {
  return searchInput ? searchInput.value.trim().toLowerCase() : "";
}

//#endregion

//#region Filtering Logic

function applyFilters() {
  const searchText = getSearchText();

  log("applyFilters", "START", {
    selectedSection,
    selectedSubCategory,
    selectedCategoryId,
    searchText,
    allProjects: allProjects.length,
  });

  filteredProjects = allProjects.filter((project) => {
    // 1. Section Filter
    if (selectedSection !== "all") {
      const pSection = String(project.data_section || "")
        .trim()
        .toLowerCase();
      const targetSection = String(selectedSection).trim().toLowerCase();
      if (pSection !== targetSection) return false;
    }

    // 2. Sub-Category (File Key) Filter
    if (selectedSubCategory !== "all") {
      const pSubCategory = String(project.data_category || "")
        .trim()
        .toLowerCase();
      const targetSubCategory = String(selectedSubCategory)
        .trim()
        .toLowerCase();
      if (pSubCategory !== targetSubCategory) return false;
    }

    // 3. Global Numeric Category Filter
    if (selectedCategoryId !== "all") {
      const targetId = Number(selectedCategoryId);
      const hasCategoryId =
        Array.isArray(project.categories) &&
        project.categories.some((id) => Number(id) === targetId);

      if (!hasCategoryId) return false;
    }

    // 4. Text Search Filter
    if (!searchText) return true;

    const searchableText = [
      project.title,
      project.description,
      project.framework_name,
      project.data_section,
      project.data_category,
      ...(project.technologies || []),
      ...(project.platforms || []),
      ...(project.categories || []).map(
        (id) => (typeof CATEGORIES !== "undefined" ? CATEGORIES[id] : "") || "",
      ),
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(searchText);
  });

  log("applyFilters", "RESULT", { filteredProjects: filteredProjects.length });

  sortProjects();
  currentPage = 1;
  renderProjects();
}

//#endregion

//#region Sorting Logic

function setupSorting() {
  if (!sortSelect) return;
  sortSelect.addEventListener("change", () => {
    sortProjects();
    currentPage = 1;
    renderProjects();
  });
}

function sortProjects() {
  const sort = sortSelect ? sortSelect.value : "featured";

  if (sort === "name") {
    filteredProjects.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "recent") {
    filteredProjects.sort((a, b) => getDateValue(b) - getDateValue(a));
  }
}

function getDateValue(project) {
  if (!project.updated_at) return 0;
  const date = new Date(project.updated_at);
  return !Number.isNaN(date.getTime()) ? date.getTime() : 0;
}

//#endregion

//#region Project Rendering & Details

function renderProjects() {
  if (!projectGrid) return;
  projectGrid.innerHTML = "";

  const visibleProjects = filteredProjects.slice(0, currentPage * PAGE_SIZE);

  if (visibleProjects.length === 0) {
    projectGrid.innerHTML = `
      <div class="catalog-empty">
        <h3>No projects found</h3>
        <p>Try another search or category.</p>
      </div>
    `;
    updateLoadMoreButton();
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const project of visibleProjects) {
    fragment.appendChild(createProjectCard(project));
  }

  projectGrid.appendChild(fragment);
  updateLoadMoreButton();
}

function getDetailUrl(project) {
  const repoUrl = project.project_url || project.ExternalUrl || "";
  if (!repoUrl) return "#";

  // If project_url is already a full GitHub URL, extract owner/repo or encode it properly
  try {
    const parsed = new URL(repoUrl);
    if (parsed.hostname === "github.com") {
      const cleanRepo = parsed.pathname
        .replace(/^\//, "")
        .replace(/\.git$/, "");
      const params = new URLSearchParams({ repo: cleanRepo });
      return `/details/?${params.toString()}`;
    }
  } catch {
    // Fallback if it's not a valid URL yet
  }

  const params = new URLSearchParams({ repo: repoUrl });
  return `/details/?${params.toString()}`;
}

function createProjectCard(project) {
  const article = document.createElement("article");
  article.className = "project-card";

  const image = getProjectImage(project);
  const imageHtml = image
    ? `<img src="${escapeAttribute(image)}" alt="${escapeAttribute(project.title)}" loading="lazy" decoding="async" onerror="handleImageError(this, '${escapeAttribute(project.data_category)}')">`
    : `<div class="project-image-placeholder">${escapeHtml(project.title.charAt(0))}</div>`;

  const categoryNames = (project.categories || [])
    .map((id) => (typeof CATEGORIES !== "undefined" ? CATEGORIES[id] : null))
    .filter(Boolean)
    .slice(0, 3);

  const categoryHtml = categoryNames
    .map((name) => `<span class="project-tag">${escapeHtml(name)}</span>`)
    .join("");

  const section =
    typeof DATA_SECTIONS !== "undefined"
      ? DATA_SECTIONS[project.data_section]
      : null;
  const sectionName = section ? section.name : project.data_section;

  article.innerHTML = `
    <a class="project-card-link" href="${escapeAttribute(getDetailUrl(project))}">
      <div class="project-image">${imageHtml}</div>
      <div class="project-card-body">
        <div class="project-host">${escapeHtml(sectionName)}</div>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.description)}</p>
        ${categoryHtml ? `<div class="project-tags">${categoryHtml}</div>` : ""}
      </div>
    </a>
  `;

  return article;
}

function getProjectImage(project) {
  return Array.isArray(project.image_urls) && project.image_urls.length > 0
    ? project.image_urls[0]
    : null;
}

//#endregion

//#region Pagination & Load More

function updateLoadMoreButton() {
  if (!loadMoreButton) return;
  const visibleCount = currentPage * PAGE_SIZE;
  const totalCount = filteredProjects.length;
  loadMoreButton.hidden = !(totalCount > 0 && visibleCount < totalCount);
}

function setupLoadMore() {
  if (!loadMoreButton) return;
  loadMoreButton.addEventListener("click", () => {
    currentPage++;
    renderProjects();
  });
}

//#endregion

//#region Mobile Navigation

function setupNavigation() {
  if (!menuToggle || !mainNav) return;
  menuToggle.addEventListener("click", () => {
    const open = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
}

//#endregion

//#region UI State

function showLoading(isLoading) {
  if (loading) loading.hidden = !isLoading;
}

function showError(message) {
  error("showError", message);
  if (!projectGrid) return;
  projectGrid.innerHTML = `
    <div class="catalog-error">
      <h3>Catalogue unavailable</h3>
      <p>${escapeHtml(message)}</p>
      <button type="button" onclick="location.reload()">Retry</button>
    </div>
  `;
}

//#endregion

//#region Utilities

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

//#endregion

//#region DOM Caching

function cacheDOM() {
  projectGrid = document.getElementById("projectGrid");
  loading = document.getElementById("loading");
  loadMoreButton = document.getElementById("loadMore");
  searchInput = document.getElementById("searchInput");
  searchButton = document.getElementById("searchButton");
  sortSelect = document.getElementById("sortSelect");
  sectionList = document.getElementById("sectionList");
  subCategoryList = document.getElementById("subCategoryList");
  categoryList = document.getElementById("categoryList");
  menuToggle = document.getElementById("menuToggle");
  mainNav = document.getElementById("mainNav");
  yearElement = document.getElementById("year");
}

//#endregion

//#region Application Entry Point

document.addEventListener("DOMContentLoaded", async () => {
  if (window.componentsReady) {
    await window.componentsReady;
  }
  cacheDOM();
  setupLoadMore();
  await initialize();
});

//#endregion
