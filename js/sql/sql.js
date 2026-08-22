//#region Browser SQLite Database (sql.js)

const CoderBasketDB = (() => {
  const DB_NAME = "coderbasket.db";

  let db = null;
  let SQL = null;
  let initPromise = null;

  // ---------------------------------------------------------
  // Schema
  // ---------------------------------------------------------

  const COLUMNS = [
    "id",
    "project_url",
    "title",
    "description",
    "section",
    "section_category",
    "technologies",
    "platforms",
    "external_url",
    "youtube_url",
    "image_url",
    "categories",
    "submitted_at",
    "status",
    "github",
  ];

  // ---------------------------------------------------------
  // Validate section/table name
  // ---------------------------------------------------------

  function normalizeSection(section) {
    const value = String(section || "")
      .trim()
      .toLowerCase();

    if (!value) {
      throw new Error("Section is required.");
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      throw new Error(`Invalid section name: ${section}`);
    }

    return value;
  }
  // ==========================================================
  // Cache metadata table
  // ==========================================================

  async function createCacheMetadataTable() {
    await init();

    db.exec(`
    CREATE TABLE IF NOT EXISTS "__cache_metadata" (

      section TEXT PRIMARY KEY,

      fetched_at INTEGER NOT NULL

    );
  `);

    return true;
  }
  async function getCacheTimestamp(section) {
    await createCacheMetadataTable();

    const sectionName = normalizeSection(section);

    const result = db.exec({
      sql: `
      SELECT fetched_at
      FROM "__cache_metadata"
      WHERE section = ?
      LIMIT 1
    `,
      bind: [sectionName],
    });

    if (result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    return Number(result[0].values[0][0]);
  }
  async function setCacheTimestamp(section) {
    await createCacheMetadataTable();

    const sectionName = normalizeSection(section);

    db.run(
      `
      INSERT INTO "__cache_metadata"
      (
        section,
        fetched_at
      )
      VALUES (?, ?)

      ON CONFLICT(section)
      DO UPDATE SET
        fetched_at = excluded.fetched_at
    `,
      [sectionName, Date.now()],
    );

    return true;
  }

  // ---------------------------------------------------------
  // Escape SQLite identifier
  // ---------------------------------------------------------

  function quoteIdentifier(name) {
    return `"${String(name).replace(/"/g, '""')}"`;
  }

  // ---------------------------------------------------------
  // Convert JS value → SQLite value
  // ---------------------------------------------------------

  function serializeValue(value) {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return value;
  }

  // ---------------------------------------------------------
  // Convert SQLite value → JS value
  // ---------------------------------------------------------

  function deserializeValue(value, column) {
    if (value === null || value === undefined || typeof value !== "string") {
      return value;
    }

    if (
      column === "technologies" ||
      column === "platforms" ||
      column === "categories" ||
      column === "github"
    ) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }

    return value;
  }

  // ---------------------------------------------------------
  // Initialize sql.js
  // ---------------------------------------------------------

  async function init() {
    // Already initialized
    if (db) {
      return db;
    }

    // Prevent multiple simultaneous initialization calls
    if (initPromise) {
      return initPromise;
    }

    initPromise = (async () => {
      console.log("[CoderBasketDB] Initializing sql.js...");

      // sql-wasm.js must be loaded before db.js
      if (typeof initSqlJs !== "function") {
        throw new Error(
          "sql.js has not been loaded. Load sql-wasm.js before db.js.",
        );
      }

      /*
       * sql.js needs the WebAssembly file.
       *
       * IMPORTANT:
       *
       * If db.js is in:
       *     /js/db.js
       *
       * and sql-wasm.wasm is also in:
       *     /js/sql-wasm.wasm
       *
       * then this path is correct:
       */

      SQL = await initSqlJs({
        locateFile: (file) => {
          console.log("[CoderBasketDB] Locating sql.js file:", file);

          return `/js/sql/${file}`;
        },
      });

      console.log("[CoderBasketDB] sql.js loaded.");

      // Create SQLite database in memory
      db = new SQL.Database();

      console.log("[CoderBasketDB] SQLite database initialized.");

      return db;
    })();

    try {
      return await initPromise;
    } catch (error) {
      initPromise = null;
      db = null;
      SQL = null;

      console.error("[CoderBasketDB] SQLite initialization failed:", error);

      throw error;
    }
  }

  // ---------------------------------------------------------
  // Get table name
  // ---------------------------------------------------------

  function getTable(section) {
    return quoteIdentifier(normalizeSection(section));
  }

  // ---------------------------------------------------------
  // Create section table
  // ---------------------------------------------------------

  async function createSection(section) {
    await init();

    const table = getTable(section);

    db.exec(`
      CREATE TABLE IF NOT EXISTS ${table} (

        id TEXT,

        project_url TEXT PRIMARY KEY,

        title TEXT NOT NULL,

        description TEXT,

        section TEXT NOT NULL,

        section_category TEXT,

        technologies TEXT,

        platforms TEXT,

        external_url TEXT,

        youtube_url TEXT,

        image_url TEXT,

        categories TEXT,

        submitted_at TEXT,

        status TEXT,

        github TEXT

      );
    `);

    return true;
  }

  // ---------------------------------------------------------
  // Check whether section table exists
  // ---------------------------------------------------------

  async function sectionExists(section) {
    await init();

    const sectionName = normalizeSection(section);

    const result = db.exec({
      sql: `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        AND name = ?
      `,
      bind: [sectionName],
    });

    return result.length > 0 && result[0].values.length > 0;
  }

  // ---------------------------------------------------------
  // Ensure section exists
  // ---------------------------------------------------------

  async function ensureSection(section) {
    if (!(await sectionExists(section))) {
      await createSection(section);
    }
  }

  // ---------------------------------------------------------
  // Save / Update project
  // ---------------------------------------------------------

  async function save(project) {
    await init();

    if (!project || typeof project !== "object") {
      throw new Error("Invalid project.");
    }

    const section = normalizeSection(project.section);

    const projectUrl = String(project.project_url || "").trim();

    if (!projectUrl) {
      throw new Error("project_url is required.");
    }

    await ensureSection(section);

    const table = getTable(section);

    const values = COLUMNS.map((column) => serializeValue(project[column]));

    const placeholders = COLUMNS.map(() => "?").join(", ");

    const columns = COLUMNS.map(quoteIdentifier).join(", ");

    db.run(
      `
        INSERT INTO ${table}
        (${columns})
        VALUES (${placeholders})

        ON CONFLICT(project_url)
        DO UPDATE SET

          id = excluded.id,
          title = excluded.title,
          description = excluded.description,
          section = excluded.section,
          section_category = excluded.section_category,
          technologies = excluded.technologies,
          platforms = excluded.platforms,
          external_url = excluded.external_url,
          youtube_url = excluded.youtube_url,
          image_url = excluded.image_url,
          categories = excluded.categories,
          submitted_at = excluded.submitted_at,
          status = excluded.status,
          github = excluded.github
      `,
      values,
    );

    return true;
  }

  // ---------------------------------------------------------
  // Save multiple projects
  // ---------------------------------------------------------

  async function saveMany(projects) {
    if (!Array.isArray(projects)) {
      throw new Error("Projects must be an array.");
    }

    await init();

    for (const project of projects) {
      await save(project);
    }

    return projects.length;
  }

  // ---------------------------------------------------------
  // Get project by URL
  // ---------------------------------------------------------

  async function getByUrl(section, projectUrl) {
    await init();

    await ensureSection(section);

    const table = getTable(section);

    const result = db.exec({
      sql: `
        SELECT *
        FROM ${table}
        WHERE project_url = ?
        LIMIT 1
      `,
      bind: [String(projectUrl).trim()],
    });

    if (result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    return convertRow(result[0].columns, result[0].values[0]);
  }

  // ---------------------------------------------------------
  // Get all projects from section
  // ---------------------------------------------------------

  async function getAll(section) {
    await init();

    await ensureSection(section);

    const table = getTable(section);

    const result = db.exec({
      sql: `
        SELECT *
        FROM ${table}
        ORDER BY title COLLATE NOCASE
      `,
    });

    if (result.length === 0 || result[0].values.length === 0) {
      return [];
    }

    const columns = result[0].columns;

    return result[0].values.map((row) => convertRow(columns, row));
  }

  // ---------------------------------------------------------
  // Convert database row
  // ---------------------------------------------------------

  function convertRow(columns, row) {
    const project = {};

    columns.forEach((column, index) => {
      project[column] = deserializeValue(row[index], column);
    });

    return project;
  }

  // ---------------------------------------------------------
  // Delete project by URL
  // ---------------------------------------------------------

  async function remove(section, projectUrl) {
    await init();

    await ensureSection(section);

    const table = getTable(section);

    db.run(
      `
        DELETE FROM ${table}
        WHERE project_url = ?
      `,
      [String(projectUrl).trim()],
    );

    return true;
  }

  // ---------------------------------------------------------
  // Delete section/table
  // ---------------------------------------------------------

  async function removeSection(section) {
    await init();

    const table = getTable(section);

    db.run(`
      DROP TABLE IF EXISTS ${table}
    `);

    return true;
  }

  // ---------------------------------------------------------
  // Count projects
  // ---------------------------------------------------------

  async function count(section) {
    await init();

    await ensureSection(section);

    const table = getTable(section);

    const result = db.exec(`
      SELECT COUNT(*) AS count
      FROM ${table}
    `);

    if (result.length === 0 || result[0].values.length === 0) {
      return 0;
    }

    return Number(result[0].values[0][0]);
  }

  // ---------------------------------------------------------
  // Clear section
  // ---------------------------------------------------------

  async function clear(section) {
    await init();

    await ensureSection(section);

    const table = getTable(section);

    db.run(`
      DELETE FROM ${table}
    `);

    return true;
  }

  // ---------------------------------------------------------
  // Export database
  // ---------------------------------------------------------

  function exportDatabase() {
    if (!db) {
      throw new Error("SQLite database has not been initialized.");
    }

    return db.export();
  }

  // ---------------------------------------------------------
  // Import database
  // ---------------------------------------------------------

  async function importDatabase(data) {
    await init();

    if (!(data instanceof Uint8Array)) {
      throw new Error("Database data must be a Uint8Array.");
    }

    db.close();

    db = new SQL.Database(data);

    console.log("[CoderBasketDB] SQLite database imported.");

    return db;
  }

  // ---------------------------------------------------------
  // Close database
  // ---------------------------------------------------------

  function close() {
    if (db) {
      db.close();
      db = null;
    }

    SQL = null;
    initPromise = null;

    console.log("[CoderBasketDB] SQLite database closed.");
  }

  // ---------------------------------------------------------
  // Public API
  // ---------------------------------------------------------

  return {
    init,

    createSection,

    sectionExists,

    ensureSection,

    save,

    saveMany,

    getByUrl,

    getAll,

    remove,

    removeSection,

    count,

    clear,

    exportDatabase,

    importDatabase,

    close,

    // Cache
    getCacheTimestamp,
    setCacheTimestamp,
  };
})();

//#endregion

//#region Coder Basket Catalogue Data

const CoderBasketData = (() => {
  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  // How long cached section data remains valid.
  //
  // 24 hours = 86,400,000 ms
  //
  // Change this if required.
  //
  const CACHE_TTL = 24 * 60 * 60 * 1000;

  // Set to true if you want one fetch per browser session
  // regardless of the TTL.
  //
  // false = TTL controls refresh
  //
  const SESSION_CACHE = true;

  const SESSION_KEY = "coderbasket_loaded_sections";

  // ==========================================================
  // Section validation
  //
  // IMPORTANT:
  // Section names are NEVER renamed.
  //
  // "react-native" remains "react-native"
  // "react" remains "react"
  // ==========================================================

  function getSectionName(section) {
    const value = String(section || "").trim();

    if (!value) {
      throw new Error("Section is required.");
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      throw new Error(`Invalid section name: ${section}`);
    }

    return value;
  }

  // ==========================================================
  // Session cache
  // ==========================================================

  function getSessionSections() {
    try {
      const value = sessionStorage.getItem(SESSION_KEY);

      if (!value) {
        return {};
      }

      const parsed = JSON.parse(value);

      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch (error) {
      console.warn("[CoderBasketData] Unable to read session cache:", error);
    }

    return {};
  }

  function markSessionSection(sectionName) {
    try {
      const sections = getSessionSections();

      sections[sectionName] = Date.now();

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sections));
    } catch (error) {
      console.warn("[CoderBasketData] Unable to save session cache:", error);
    }
  }

  function isSessionSectionLoaded(sectionName) {
    if (!SESSION_CACHE) {
      return false;
    }

    const sections = getSessionSections();

    return Boolean(sections[sectionName]);
  }

  // ==========================================================
  // Check whether SQLite cache is still valid
  // ==========================================================

  async function isCacheValid(sectionName) {
    const fetchedAt = await CoderBasketDB.getCacheTimestamp(sectionName);

    if (!fetchedAt) {
      return false;
    }

    const age = Date.now() - fetchedAt;

    return age < CACHE_TTL;
  }

  // ==========================================================
  // Merge projects
  //
  // Remote wins when project_url matches.
  // ==========================================================

  function mergeProjects(databaseItems, remoteItems) {
    const map = new Map();

    // --------------------------------------------------------
    // SQLite
    // --------------------------------------------------------

    for (const project of databaseItems || []) {
      if (!project || typeof project !== "object") {
        continue;
      }

      const url = String(project.project_url || "").trim();

      if (!url) {
        continue;
      }

      map.set(url, project);
    }

    // --------------------------------------------------------
    // Apps Script
    //
    // Remote wins.
    // --------------------------------------------------------

    for (const project of remoteItems || []) {
      if (!project || typeof project !== "object") {
        continue;
      }

      const url = String(project.project_url || "").trim();

      if (!url) {
        continue;
      }

      map.set(url, project);
    }

    return Array.from(map.values());
  }
  async function getSectionJson(sectionName, options = {}) {
    const url = `/data/${encodeURIComponent(sectionName)}.json`;

    const response = await fetch(url, {
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to load section "${sectionName}": HTTP ${response.status}`,
      );
    }

    const data = await response.json();

    return Array.isArray(data) ? data : [];
  }

  async function getSection(section, options = {}) {
    const sectionName = getSectionName(section);
    const forceRefresh = options.forceRefresh === true;

    console.log("[CoderBasketData] Loading section:", sectionName, {
      forceRefresh,
    });

    return getSectionJson(section);
    // ========================================================
    // 1. INITIALIZE SQLITE
    // ========================================================

    await CoderBasketDB.init();

    // ========================================================
    // 2. READ SQLITE
    // ========================================================

    let databaseItems = [];

    try {
      databaseItems = await CoderBasketDB.getAll(sectionName);

      if (!Array.isArray(databaseItems)) {
        databaseItems = [];
      }

      console.log("[CoderBasketData] SQLite cache:", {
        section: sectionName,
        count: databaseItems.length,
      });
    } catch (error) {
      console.warn("[CoderBasketData] SQLite read failed:", {
        section: sectionName,
        error,
      });

      databaseItems = [];
    }

    // ========================================================
    // 3. DETERMINE WHETHER REMOTE FETCH IS REQUIRED
    // ========================================================

    let shouldFetchRemote = false;

    // --------------------------------------------------------
    // Force refresh
    // --------------------------------------------------------

    if (forceRefresh) {
      console.log("[CoderBasketData] Force refresh requested:", sectionName);

      shouldFetchRemote = true;
    }

    // --------------------------------------------------------
    // EMPTY DATABASE
    //
    // IMPORTANT:
    // Always try remote when there are no local items.
    // --------------------------------------------------------
    else if (databaseItems.length === 0) {
      console.log(
        "[CoderBasketData] SQLite is empty. Remote fetch required:",
        sectionName,
      );

      shouldFetchRemote = true;
    }

    // --------------------------------------------------------
    // DATABASE HAS DATA
    // --------------------------------------------------------
    else {
      // ------------------------------------------------------
      // Already loaded during this browser session
      // ------------------------------------------------------

      if (isSessionSectionLoaded(sectionName)) {
        console.log(
          "[CoderBasketData] Section already loaded this session:",
          sectionName,
        );

        return databaseItems;
      }

      // ------------------------------------------------------
      // Check TTL
      // ------------------------------------------------------

      let valid = false;

      try {
        valid = await isCacheValid(sectionName);
      } catch (error) {
        console.warn("[CoderBasketData] Cache validation failed:", {
          section: sectionName,
          error,
        });

        // If cache validation fails,
        // try remote rather than trusting unknown state.
        valid = false;
      }

      if (valid) {
        console.log("[CoderBasketData] SQLite cache is valid:", sectionName);

        markSessionSection(sectionName);

        return databaseItems;
      }

      // ------------------------------------------------------
      // Cache expired
      // ------------------------------------------------------

      console.log(
        "[CoderBasketData] SQLite cache expired. Remote fetch required:",
        sectionName,
      );

      shouldFetchRemote = true;
    }

    // ========================================================
    // 4. LOCAL SQLITE IS SUFFICIENT
    // ========================================================

    if (!shouldFetchRemote) {
      markSessionSection(sectionName);

      return databaseItems;
    }

    // ========================================================
    // 5. FETCH REMOTE
    // ========================================================

    let remoteItems = [];

    try {
      console.log("[CoderBasketData] Fetching Apps Script:", sectionName);

      remoteItems = await getProjectsFromAppsScript(sectionName);

      if (!Array.isArray(remoteItems)) {
        console.warn("[CoderBasketData] Apps Script returned invalid data:", {
          section: sectionName,
          remoteItems,
        });

        remoteItems = [];
      }

      console.log("[CoderBasketData] Apps Script returned:", {
        section: sectionName,
        count: remoteItems.length,
      });
    } catch (error) {
      console.warn("[CoderBasketData] Apps Script failed:", {
        section: sectionName,
        error,
      });

      // ======================================================
      // REMOTE FAILED
      // ======================================================

      if (databaseItems.length > 0) {
        // ----------------------------------------------------
        // We have a local fallback.
        // ----------------------------------------------------

        console.log(
          "[CoderBasketData] Using existing SQLite cache:",
          sectionName,
        );

        markSessionSection(sectionName);

        return databaseItems;
      }

      // ------------------------------------------------------
      // No database + remote failed.
      //
      // Google/network is outside our control.
      // Return empty instead of crashing the application.
      // ------------------------------------------------------

      console.warn(
        "[CoderBasketData] No SQLite fallback available. Returning empty section:",
        sectionName,
      );

      markSessionSection(sectionName);

      return [];
    }

    // ========================================================
    // 6. REMOTE RETURNED ZERO ITEMS
    // ========================================================

    if (remoteItems.length === 0) {
      console.warn(
        "[CoderBasketData] Remote returned zero items:",
        sectionName,
      );

      // ------------------------------------------------------
      // NEVER overwrite existing useful SQLite data with [].
      // ------------------------------------------------------

      if (databaseItems.length > 0) {
        console.log(
          "[CoderBasketData] Keeping existing SQLite data:",
          sectionName,
        );

        markSessionSection(sectionName);

        return databaseItems;
      }

      // ------------------------------------------------------
      // No DB + no remote data.
      // ------------------------------------------------------

      markSessionSection(sectionName);

      return [];
    }

    // ========================================================
    // 7. MERGE REMOTE WITH EXISTING SQLITE
    //
    // This prevents duplicates.
    // ========================================================

    const merged = mergeProjects(databaseItems, remoteItems);

    console.log("[CoderBasketData] Merged remote + SQLite:", {
      section: sectionName,
      cached: databaseItems.length,
      remote: remoteItems.length,
      merged: merged.length,
    });

    // ========================================================
    // 8. UPDATE SQLITE
    // ========================================================

    try {
      await CoderBasketDB.saveMany(remoteItems);

      await CoderBasketDB.setCacheTimestamp(sectionName);

      console.log("[CoderBasketData] SQLite cache updated:", {
        section: sectionName,
        count: remoteItems.length,
      });
    } catch (error) {
      console.warn("[CoderBasketData] Failed to update SQLite:", {
        section: sectionName,
        error,
      });

      // Remote data is still valid.
      // Continue and return it/merged data.
    }

    // ========================================================
    // 9. MARK SESSION
    // ========================================================

    markSessionSection(sectionName);

    // ========================================================
    // 10. RETURN MERGED RESULT
    // ========================================================

    console.log("[CoderBasketData] Section ready:", {
      section: sectionName,
      cached: databaseItems.length,
      remote: remoteItems.length,
      merged: merged.length,
    });

    return merged;
  }

  // ==========================================================
  // FORCE REFRESH
  //
  // Example:
  //
  // await CoderBasketData.refreshSection("react");
  //
  // ==========================================================

  async function refreshSection(section) {
    return getSection(section, {
      forceRefresh: true,
    });
  }

  // ==========================================================
  // CLEAR SESSION CACHE
  //
  // Useful for a "Refresh All" button.
  // ==========================================================

  function clearSessionCache() {
    try {
      sessionStorage.removeItem(SESSION_KEY);

      console.log("[CoderBasketData] Session cache cleared.");
    } catch (error) {
      console.warn("[CoderBasketData] Unable to clear session cache:", error);
    }
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  return {
    getSection,

    refreshSection,

    clearSessionCache,
  };
})();

//#endregion
