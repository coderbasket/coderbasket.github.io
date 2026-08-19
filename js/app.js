"use strict";

/*
 * Coder Basket
 * Static catalogue application
 *
 * Architecture:
 *
 *   URL
 *    |
 *    v
 * restoreSelection()
 *    |
 *    +---- selectedSection
 *    +---- selectedSubCategory
 *    +---- selectedCategoryId
 *    |
 *    v
 * loadCatalog()
 *    |
 *    +---- normal section
 *    |       ai.json
 *    |       dotnet.json
 *    |       flutter.json
 *    |
 *    +---- virtual framework
 *            frameworks.json
 *            + Kotlin
 *            + React
 *            + Vue
 *            + ...
 *    |
 *    v
 * normalizeProjects()
 *    |
 *    v
 * applyFilters()
 *    |
 *    v
 * filteredProjects
 *    |
 *    v
 * renderProjects()
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

let selectedSection =
  typeof DEFAULT_SECTION !== "undefined" ? DEFAULT_SECTION : "ai";

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

//#region Selection State

function restoreSelection() {
  log("restoreSelection", "Reading URL selection");

  let path = window.location.pathname.replace(/^\/+|\/+$/g, "");

  /*
   * Remove index.html.
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
   * SECTION
   * -------------------------------------------------------
   */

  const configuredPageSection =
    typeof window.CODER_BASKET_SECTION === "string"
      ? window.CODER_BASKET_SECTION.trim()
      : null;

  const candidateSection = urlSection || configuredPageSection;

  if (candidateSection && isValidSection(candidateSection)) {
    selectedSection = candidateSection;
  } else {
    selectedSection =
      typeof DEFAULT_SECTION !== "undefined" ? DEFAULT_SECTION : "ai";
  }

  /*
   * -------------------------------------------------------
   * SUB-CATEGORY
   * -------------------------------------------------------
   */

  selectedSubCategory = urlSubCategory ? String(urlSubCategory) : "all";

  /*
   * -------------------------------------------------------
   * CATEGORY
   * -------------------------------------------------------
   */

  if (urlCategory === "all") {
    selectedCategoryId = "all";
  } else if (
    urlCategory !== null &&
    typeof CATEGORIES !== "undefined" &&
    CATEGORIES[Number(urlCategory)]
  ) {
    selectedCategoryId = Number(urlCategory);
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

    isFramework: isFrameworkSection(selectedSection),
  });
}

function isValidSection(sectionKey) {
  if (!sectionKey) {
    return false;
  }

  if (sectionKey === "all") {
    return true;
  }

  if (typeof DATA_SECTIONS !== "undefined" && DATA_SECTIONS[sectionKey]) {
    return true;
  }

  if (typeof FRAMEWORKS !== "undefined" && FRAMEWORKS[sectionKey]) {
    return true;
  }

  return false;
}

function saveSelection() {
  log("saveSelection", {
    selectedSection,
    selectedSubCategory,
    selectedCategoryId,
  });

  if (typeof STORAGE_KEYS === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEYS.section, selectedSection);

  localStorage.setItem(STORAGE_KEYS.subCategory, selectedSubCategory);

  localStorage.setItem(STORAGE_KEYS.category, String(selectedCategoryId));
}

//#endregion

//#region Section / Framework Helpers

function isFrameworkSection(sectionKey) {
  return (
    typeof FRAMEWORKS !== "undefined" &&
    FRAMEWORKS &&
    Object.prototype.hasOwnProperty.call(FRAMEWORKS, sectionKey)
  );
}

function getFrameworkConfig(sectionKey) {
  if (!isFrameworkSection(sectionKey)) {
    return null;
  }

  return FRAMEWORKS[sectionKey];
}

function getDataSourceSectionKey(sectionKey) {
  /*
   * Normal catalogue section.
   *
   * ai
   * dotnet
   * flutter
   * frameworks
   */
  if (typeof DATA_SECTIONS !== "undefined" && DATA_SECTIONS[sectionKey]) {
    return sectionKey;
  }

  /*
   * Virtual framework.
   *
   * kotlin
   * react
   * vue
   * angular
   *
   * all use frameworks.json.
   */
  if (isFrameworkSection(sectionKey)) {
    const framework = getFrameworkConfig(sectionKey);

    return framework?.dataSource || "frameworks";
  }

  return sectionKey;
}

function getSectionDisplayName(sectionKey) {
  if (sectionKey === "all") {
    return "All";
  }

  if (typeof DATA_SECTIONS !== "undefined" && DATA_SECTIONS[sectionKey]) {
    return DATA_SECTIONS[sectionKey].name;
  }

  if (isFrameworkSection(sectionKey)) {
    return FRAMEWORKS[sectionKey].name;
  }

  return sectionKey;
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
    /*
     * Determine which physical JSON sources
     * need to be loaded.
     */

    const sectionsToLoad =
      selectedSection === "all" ? getAllCatalogueSources() : [selectedSection];

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
        warn("loadCatalog", "Unable to load catalogue source:", result.reason);
      }
    }

    allProjects = normalizeProjects(projects);

    log("loadCatalog", "Normalized projects:", allProjects.length);

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

function getAllCatalogueSources() {
  const sources = [];

  /*
   * Normal catalogue sections.
   */
  if (typeof DATA_SECTION_ORDER !== "undefined") {
    for (const sectionKey of DATA_SECTION_ORDER) {
      if (DATA_SECTIONS?.[sectionKey]) {
        sources.push(sectionKey);
      }
    }
  }

  /*
   * Framework catalogue.
   *
   * All virtual frameworks share
   * frameworks.json.
   *
   * We only load it once.
   */
  if (
    typeof DATA_SECTIONS !== "undefined" &&
    DATA_SECTIONS.frameworks &&
    !sources.includes("frameworks")
  ) {
    sources.push("frameworks");
  }

  return sources;
}

async function loadCatalogSection(sectionKey) {
  const sourceSectionKey = getDataSourceSectionKey(sectionKey);

  /*
   * Physical source configuration.
   */
  const sourceConfig =
    typeof DATA_SECTIONS !== "undefined"
      ? DATA_SECTIONS[sourceSectionKey]
      : null;

  /*
   * Virtual framework configuration.
   */
  const frameworkConfig = isFrameworkSection(sectionKey)
    ? getFrameworkConfig(sectionKey)
    : null;

  if (!sourceConfig && !frameworkConfig) {
    warn("loadCatalogSection", `Unknown catalogue section: ${sectionKey}`, {
      sectionKey,
      sourceSectionKey,
    });

    return [];
  }

  const fileName =
    sourceConfig?.file || frameworkConfig?.file || `${sourceSectionKey}.json`;

  const url = `${DATA_BASE_URL}${fileName}`;

  log("loadCatalogSection", "Loading:", {
    requestedSection: sectionKey,

    sourceSection: sourceSectionKey,

    fileName,
    url,

    framework: isFrameworkSection(sectionKey),
  });

  try {
    const response = await fetch(url);

    if (!response.ok) {
      warn("loadCatalogSection", `Unable to load source: ${url}`, {
        status: response.status,

        sectionKey,
        sourceSectionKey,
      });

      return [];
    }

    const text = await response.text();

    if (!text.trim()) {
      warn("loadCatalogSection", `Empty catalogue source: ${url}`);

      return [];
    }

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

    /*
     * Determine the actual section
     * represented by this source.
     */
    const finalItems = items.map((item) => {
      const itemSection =
        item.section ||
        item.data_section ||
        item.DataSection ||
        sourceSectionKey;

      const itemCategory =
        item.section_category ||
        item.data_category ||
        item.DataCategory ||
        "all";

      return {
        ...item,

        /*
         * Physical JSON source.
         */
        source_section: sourceSectionKey,

        /*
         * Actual catalogue section.
         *
         * For ai.json:
         *   ai
         *
         * For frameworks.json:
         *   frameworks
         * unless the item explicitly
         * provides its own section.
         */
        data_section: itemSection,

        /*
         * Sub-category/file key.
         */
        data_category: itemCategory,
      };
    });

    log("loadCatalogSection", "Loaded:", {
      sectionKey,
      sourceSectionKey,
      count: finalItems.length,
    });

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

//#endregion

//#region Data Normalization

function normalizeProjects(projects) {
  return projects.map((project, index) => {
    console.log(
      "%c[normalizeProjects] PROJECT",
      "color: red; font-weight: bold;",
      {
        index,

        title: project.title || project.Title || "(no title)",

        // Check every possible GitHub URL property
        project_url: project.project_url,
        ProjectUrl: project.ProjectUrl,
        projectUrl: project.projectUrl,

        github_url: project.github_url,
        GitHubUrl: project.GitHubUrl,

        github: project.github,
        GitHub: project.GitHub,

        // Show where the project came from
        section: project.section || project.data_section || project.DataSection,

        source_section: project.source_section,
        source_section_category: project.section_category,

        // Show the complete original object
        rawProject: project,
      },
    );

    /*
     * ---------------------------------------------------
     * CATEGORIES
     * ---------------------------------------------------
     */

    const rawCategories = Array.isArray(project.categories)
      ? project.categories
      : Array.isArray(project.Categories)
        ? project.Categories
        : [];

    const categories =
      rawCategories.length > 0 ? [...new Set(rawCategories)] : [41];

    /*
     * ---------------------------------------------------
     * PLATFORMS
     * ---------------------------------------------------
     */

    const platforms = Array.isArray(project.platforms)
      ? [...new Set(project.platforms)]
      : Array.isArray(project.Platforms)
        ? [...new Set(project.Platforms)]
        : [];

    /*
     * ---------------------------------------------------
     * TECHNOLOGIES
     * ---------------------------------------------------
     */

    const technologies = Array.isArray(project.technologies)
      ? [...new Set(project.technologies)]
      : Array.isArray(project.Technologies)
        ? [...new Set(project.Technologies)]
        : project.technology
          ? [project.technology]
          : project.framework_name
            ? [project.framework_name]
            : project.FrameWorkName
              ? [project.FrameWorkName]
              : [];

    /*
     * ---------------------------------------------------
     * FRAMEWORK
     * ---------------------------------------------------
     */

    const frameworkName = getProjectFramework(project, technologies);

    /*
     * ---------------------------------------------------
     * IMAGES
     * ---------------------------------------------------
     */

    let imageUrls = [];

    if (project.image_url) {
      imageUrls = [project.image_url];
    } else if (Array.isArray(project.ImageUrls)) {
      imageUrls = project.ImageUrls.filter(Boolean);
    } else if (Array.isArray(project.image_urls)) {
      imageUrls = project.image_urls.filter(Boolean);
    }

    /*
     * ---------------------------------------------------
     * DATA CATEGORY
     * ---------------------------------------------------
     */

    const dataCategory =
      project.data_category ||
      project.section_category ||
      project.DataCategory ||
      "";

    /*
     * ---------------------------------------------------
     * FALLBACK ICON
     * ---------------------------------------------------
     */

    if (imageUrls.length === 0 && typeof getCategoryIcon === "function") {
      const categoryIcon = getCategoryIcon(dataCategory);

      if (categoryIcon) {
        imageUrls = [categoryIcon];
      }
    }

    /*
     * ---------------------------------------------------
     * NORMALIZED GITHUB URL
     * ---------------------------------------------------
     */

    const normalizedProjectUrl =
      project.project_url ||
      project.ProjectUrl ||
      project.projectUrl ||
      project.github_url ||
      project.GitHubUrl ||
      project.github ||
      project.GitHub ||
      "";

    console.log(
      "%c[normalizeProjects] NORMALIZED URL",
      "color: red; font-weight: bold;",
      {
        title: project.title || project.Title || "(no title)",

        normalizedProjectUrl,

        hasGitHubUrl: Boolean(normalizedProjectUrl),
      },
    );

    /*
     * ---------------------------------------------------
     * RETURN NORMALIZED PROJECT
     * ---------------------------------------------------
     */

    return {
      project_url: normalizedProjectUrl,

      title: project.title || project.Title || "Untitled Project",

      description:
        project.description ||
        project.Description ||
        "No description available.",

      platforms,

      external_url: project.external_url ?? project.ExternalUrl ?? null,

      youtube_url: project.youtube_url ?? project.YoutubeUrl ?? null,

      technologies,

      framework_name: frameworkName,

      categories,

      image_urls: imageUrls,

      data_section:
        project.section ||
        project.data_section ||
        project.DataSection ||
        project.source_section ||
        "",

      data_category:
        project.section_category ||
        project.data_category ||
        project.DataCategory ||
        "all",

      source_section: project.source_section || "",

      framework:
        project.framework ||
        project.Framework ||
        project.framework_name ||
        project.FrameWorkName ||
        project.frameworkName ||
        project.FrameworkName ||
        "",

      updated_at:
        project.updated_at || project.updated || project.UpdatedAt || null,
      source_section_category: project.section_category,
    };
  });
}

function getProjectFramework(project, technologies) {
  /*
   * Explicit framework fields always
   * have priority over technologies.
   */

  return (
    project.framework_name ||
    project.FrameWorkName ||
    project.framework ||
    project.Framework ||
    project.frameworkName ||
    project.FrameworkName ||
    technologies[0] ||
    "others"
  );
}

//#endregion

//#region Framework Matching

function projectMatchesFramework(project, frameworkKey) {
  const frameworkConfig = getFrameworkConfig(frameworkKey);

  if (!frameworkConfig) {
    return false;
  }

  /*
   * ---------------------------------------------------
   * Framework aliases
   * ---------------------------------------------------
   */

  const aliases = new Set();

  aliases.add(normalizeValue(frameworkKey));

  aliases.add(normalizeValue(frameworkConfig.name));

  /*
   * nextjs / Next.js
   */
  if (frameworkKey === "nextjs") {
    aliases.add("next");
    aliases.add("next.js");
  }

  /*
   * react-native
   */
  if (frameworkKey === "react-native") {
    aliases.add("react native");
    aliases.add("reactnative");
  }

  /*
   * kotlin-multiplatform
   */
  if (frameworkKey === "kotlin-multiplatform") {
    aliases.add("kotlin multiplatform");

    aliases.add("kotlin-multiplatform");

    aliases.add("kmp");
  }

  /*
   * ruby-on-rails
   */
  if (frameworkKey === "ruby-on-rails") {
    aliases.add("ruby on rails");

    aliases.add("rails");
  }

  /*
   * ---------------------------------------------------
   * Collect project framework values
   * ---------------------------------------------------
   */

  const values = [
    project.framework,
    project.framework_name,
    project.frameworkName,
    project.Framework,
    project.FrameworkName,
    project.FrameWorkName,
    project.technology,

    ...(Array.isArray(project.technologies) ? project.technologies : []),
  ]
    .filter(Boolean)
    .map(normalizeValue);

  /*
   * Direct match.
   */
  for (const value of values) {
    if (aliases.has(value)) {
      return true;
    }
  }

  /*
   * Some catalogue data may contain
   * multiple framework names in a
   * string such as:
   *
   * "React, TypeScript"
   */
  for (const value of values) {
    for (const alias of aliases) {
      if (value.includes(alias)) {
        return true;
      }
    }
  }

  return false;
}

function normalizeValue(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_]+/g, "-")
    .replace(/\s+/g, " ");
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
      detail: {
        categories: categoryIds,
      },
    }),
  );
}

//#endregion

//#region Sidebar Renderers

function renderSections() {
  if (!sectionList) {
    return;
  }

  sectionList.innerHTML = "";

  addFilterLink(
    sectionList,
    "All",
    "all",
    selectedSection === "all",
    "section",
  );

  if (typeof DATA_SECTION_ORDER === "undefined") {
    return;
  }

  for (const sectionKey of DATA_SECTION_ORDER) {
    const section = DATA_SECTIONS?.[sectionKey];

    if (!section) {
      continue;
    }

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
  if (!subCategoryList) {
    return;
  }

  subCategoryList.innerHTML = "";

  addFilterLink(
    subCategoryList,
    "All Sub-Categories",
    "all",
    selectedSubCategory === "all",
    "subcategory",
  );

  /*
   * Use only currently loaded projects.
   */
  const subCategories = new Map();

  for (const project of allProjects) {
    const key = String(project.data_category || "").trim();

    if (!key || key === "all") {
      continue;
    }

    if (!subCategories.has(key)) {
      subCategories.set(key, key);
    }
  }

  const sorted = [...subCategories.values()].sort((a, b) => a.localeCompare(b));

  for (const subCatKey of sorted) {
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
  if (!categoryList) {
    return;
  }

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
    if (!Array.isArray(project.categories)) {
      continue;
    }

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

//#region Filter Links

function addFilterLink(container, text, value, active, type) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "category-link";

  if (active) {
    button.classList.add("active");
  }

  button.textContent = text;

  button.addEventListener("click", async () => {
    log("addFilterLink", "CLICK", {
      type,
      text,
      value,
    });

    /*
     * ---------------------------------------------------
     * SECTION
     * ---------------------------------------------------
     */

    if (type === "section") {
      selectedSection = value;

      selectedSubCategory = "all";

      selectedCategoryId = "all";

      saveSelection();

      currentPage = 1;

      renderSections();
      renderSubCategories();
      renderCategories();

      await loadCatalog();

      return;
    }

    /*
     * ---------------------------------------------------
     * SUB-CATEGORY
     * ---------------------------------------------------
     */

    if (type === "subcategory") {
      selectedSubCategory = value === "all" ? "all" : String(value);

      saveSelection();

      currentPage = 1;

      renderSubCategories();

      applyFilters();

      return;
    }

    /*
     * ---------------------------------------------------
     * GLOBAL CATEGORY
     * ---------------------------------------------------
     */

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

//#region Search

function setupSearch() {
  if (!searchInput) {
    return;
  }

  searchInput.addEventListener("input", () => {
    applyFilters();
  });

  if (searchButton) {
    searchButton.addEventListener("click", () => {
      applyFilters();
    });
  }
}

function getSearchText() {
  return searchInput ? searchInput.value.trim().toLowerCase() : "";
}

//#endregion

//#region Filtering

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
    /*
     * -------------------------------------------------
     * 1. SECTION / FRAMEWORK
     * -------------------------------------------------
     */

    if (selectedSection !== "all") {
      /*
       * Virtual framework page.
       *
       * /kotlin/
       * /react/
       * /vue/
       *
       * All come from frameworks.json.
       */
      if (isFrameworkSection(selectedSection)) {
        /*
         * Ensure project came from
         * the framework data source.
         */
        const expectedSource = normalizeValue(
          getDataSourceSectionKey(selectedSection),
        );

        const projectSource = normalizeValue(project.source_section);

        if (projectSource !== expectedSource) {
          return false;
        }

        /*
         * Now match the actual
         * framework.
         */
        if (!projectMatchesFramework(project, selectedSection)) {
          return false;
        }
      } else {
        /*
         * Normal section:
         *
         * ai
         * dotnet
         * flutter
         */
        const projectSection = normalizeValue(project.data_section);

        const targetSection = normalizeValue(selectedSection);

        if (projectSection !== targetSection) {
          return false;
        }
      }
    }

    /*
     * -------------------------------------------------
     * 2. SUB-CATEGORY
     * -------------------------------------------------
     */

    if (selectedSubCategory !== "all") {
      const projectSubCategory = normalizeValue(project.data_category);

      const targetSubCategory = normalizeValue(selectedSubCategory);

      if (projectSubCategory !== targetSubCategory) {
        return false;
      }
    }

    /*
     * -------------------------------------------------
     * 3. NUMERIC CATEGORY
     * -------------------------------------------------
     */

    if (selectedCategoryId !== "all") {
      const targetId = Number(selectedCategoryId);

      const hasCategory =
        Array.isArray(project.categories) &&
        project.categories.some((id) => Number(id) === targetId);

      if (!hasCategory) {
        return false;
      }
    }

    /*
     * -------------------------------------------------
     * 4. SEARCH
     * -------------------------------------------------
     */

    if (!searchText) {
      return true;
    }

    const categoryNames = (project.categories || []).map((id) =>
      typeof CATEGORIES !== "undefined" ? CATEGORIES[id] || "" : "",
    );

    const searchableText = [
      project.title,
      project.description,
      project.framework_name,
      project.framework,
      project.data_section,
      project.data_category,

      ...(project.technologies || []),

      ...(project.platforms || []),

      ...categoryNames,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(searchText);
  });

  log("applyFilters", "RESULT", {
    filteredProjects: filteredProjects.length,
  });

  sortProjects();

  currentPage = 1;

  renderProjects();
}

//#endregion

//#region Sorting

function setupSorting() {
  if (!sortSelect) {
    return;
  }

  sortSelect.addEventListener("change", () => {
    sortProjects();

    currentPage = 1;

    renderProjects();
  });
}

function sortProjects() {
  const sort = sortSelect ? sortSelect.value : "featured";

  if (sort === "name") {
    filteredProjects.sort((a, b) =>
      String(a.title || "").localeCompare(String(b.title || "")),
    );
  } else if (sort === "recent") {
    filteredProjects.sort((a, b) => getDateValue(b) - getDateValue(a));
  }
}

function getDateValue(project) {
  if (!project.updated_at) {
    return 0;
  }

  const date = new Date(project.updated_at);

  return !Number.isNaN(date.getTime()) ? date.getTime() : 0;
}

//#endregion

//#region Project Rendering

function renderProjects() {
  if (!projectGrid) {
    return;
  }

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

//#endregion

//#region Project Details

function getDetailUrl(project) {
  const repoUrl = project.project_url || "";

  if (!repoUrl) {
    return "#";
  }

  /*
   * Store complete project JSON.
   */
  try {
    const parsed = new URL(repoUrl);

    if (parsed.hostname === "github.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);

      if (parts.length >= 2) {
        const owner = parts[0];

        const repo = parts[1].replace(/\.git$/, "");

        const storageKey = `coderbasket_project_${owner}_${repo}`.toLowerCase();

        const existing = localStorage.getItem(storageKey);

        if (!existing) {
          localStorage.setItem(storageKey, JSON.stringify(project));

          log("ProjectDetails", "Stored new project:", {
            storageKey,
          });
        } else {
          try {
            const existingProject = JSON.parse(existing);

            /*
             * Existing detail data
             * wins over base data.
             */
            const updatedProject = {
              ...project,
              ...existingProject,
            };

            localStorage.setItem(storageKey, JSON.stringify(updatedProject));
          } catch (parseError) {
            warn(
              "ProjectDetails",
              "Existing data is invalid. Replacing it:",
              parseError,
            );

            localStorage.setItem(storageKey, JSON.stringify(project));
          }
        }
      }
    }
  } catch (errorValue) {
    warn("ProjectDetails", "Failed to store project:", errorValue);
  }

  /*
   * Full GitHub URL remains
   * inside repo parameter.
   */
  const params = new URLSearchParams({
    repo: repoUrl,
  });

  return `/details/?${params.toString()}`;
}

//#endregion

//#region Project Card

function createProjectCard(project) {
  const article = document.createElement("article");
  article.className = "project-card";

  // =========================================================
  // GITHUB REPOSITORY
  // =========================================================

  const repo = getGitHubRepo(project.project_url);

  if (repo) {
    article.dataset.repo = repo;
  }

  // =========================================================
  // PROJECT IMAGE
  // =========================================================

  const image = getProjectImage(project);

  const imageHtml = image
    ? `<img
         src="${escapeAttribute(image)}"
         alt="${escapeAttribute(project.title)}"
         loading="lazy"
         decoding="async"
         onerror="handleImageError(
           this,
           '${escapeAttribute(project.data_category)}'
         )"
       >`
    : `<div class="project-image-placeholder">
         ${escapeHtml(String(project.title || "?").charAt(0))}
       </div>`;

  // =========================================================
  // CATEGORIES
  // =========================================================

  const categoryNames = (project.categories || [])
    .map((id) => (typeof CATEGORIES !== "undefined" ? CATEGORIES[id] : null))
    .filter(Boolean)
    .slice(0, 3);

  const categoryHtml = categoryNames
    .map((name) => `<span class="project-tag">${escapeHtml(name)}</span>`)
    .join("");

  // =========================================================
  // SECTION / FRAMEWORK LABEL
  // =========================================================

  const sectionName =
    typeof getProjectCardSectionName === "function"
      ? getProjectCardSectionName(project)
      : (typeof DATA_SECTIONS !== "undefined"
          ? DATA_SECTIONS[project.data_section]
          : null
        )?.name ||
        project.data_section ||
        "";

  const sectionCategory = String(project.source_section_category || "").trim();

  const sectionLabel = sectionCategory
    ? `${sectionName} · ${sectionCategory}`
    : sectionName;
  // =========================================================
  // CARD HTML
  // =========================================================

  article.innerHTML = `
    <a
      class="project-card-link"
      href="${escapeAttribute(getDetailUrl(project))}"
    >

      <div class="project-image">
        ${imageHtml}
      </div>

      <div class="project-card-body">

        <div class="project-host">
          ${escapeHtml(sectionLabel)}
        </div>

        <h3>
          ${escapeHtml(project.title)}
        </h3>

        <p>
          ${escapeHtml(project.description)}
        </p>

        ${
          categoryHtml
            ? `
              <div class="project-tags">
                ${categoryHtml}
              </div>
            `
            : ""
        }

        ${
          repo
            ? `
              <div
                class="project-stats"
                data-stats
                aria-label="GitHub statistics"
              ></div>
            `
            : ""
        }

      </div>

    </a>
  `;

  // =========================================================
  // LOAD GITHUB STATS
  // =========================================================

  if (repo && typeof loadGitHubStats === "function") {
    loadGitHubStats(article, repo);
  }

  return article;
}

function getProjectCardSectionName(project) {
  /*
   * If this is a framework project,
   * display its framework.
   */
  if (project.framework_name && project.source_section === "frameworks") {
    return project.framework_name;
  }

  /*
   * Normal section.
   */
  if (typeof DATA_SECTIONS !== "undefined") {
    const section = DATA_SECTIONS[project.data_section];

    if (section) {
      return section.name;
    }
  }

  return project.data_section || project.source_section || "";
}

function getGitHubRepo(url) {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);

    if (parsed.hostname !== "github.com") {
      return "";
    }

    const parts = parsed.pathname.split("/").filter(Boolean);

    if (parts.length < 2) {
      return "";
    }

    return `${parts[0]}/${parts[1]}`;
  } catch {
    return "";
  }
}

function getProjectImage(project) {
  return Array.isArray(project.image_urls) && project.image_urls.length > 0
    ? project.image_urls[0]
    : null;
}

//#endregion

//#region Pagination

function updateLoadMoreButton() {
  if (!loadMoreButton) {
    return;
  }

  const visibleCount = currentPage * PAGE_SIZE;

  const totalCount = filteredProjects.length;

  loadMoreButton.hidden = !(totalCount > 0 && visibleCount < totalCount);
}

function setupLoadMore() {
  if (!loadMoreButton) {
    return;
  }

  if (loadMoreButton.dataset.ready === "true") {
    return;
  }

  loadMoreButton.dataset.ready = "true";

  loadMoreButton.addEventListener("click", () => {
    currentPage++;

    renderProjects();
  });
}

//#endregion

//#region Mobile Navigation

function setupNavigation() {
  if (!menuToggle || !mainNav) {
    return;
  }

  if (menuToggle.dataset.navigationReady === "true") {
    return;
  }

  menuToggle.dataset.navigationReady = "true";

  menuToggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const open = mainNav.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(open));
  });
}

//#endregion

//#region UI State

function showLoading(isLoading) {
  if (loading) {
    loading.hidden = !isLoading;
  }
}

function showError(message) {
  error("showError", message);

  if (!projectGrid) {
    return;
  }

  projectGrid.innerHTML = `
    <div class="catalog-error">
      <h3>Catalogue unavailable</h3>
      <p>${escapeHtml(message)}</p>

      <button
        type="button"
        onclick="location.reload()"
      >
        Retry
      </button>
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
  /*
   * Wait for shared components
   * such as header/footer.
   */
  if (window.componentsReady) {
    await window.componentsReady;
  }

  cacheDOM();

  setupLoadMore();

  await initialize();
});

//#endregion
