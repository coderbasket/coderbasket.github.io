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
  };
})();

//#endregion

//#region Coder Basket Catalogue Data

//#region Coder Basket Catalogue Data

const CoderBasketData = (() => {
  /**
   * Merge projects by project_url.
   *
   * Local JSON is loaded first.
   * SQLite projects overwrite matching local projects.
   */
  function mergeProjects(localItems, databaseItems) {
    const map = new Map();

    // -------------------------------------------------------
    // 1. Local JSON first
    // -------------------------------------------------------

    for (const project of localItems || []) {
      if (!project || typeof project !== "object") {
        continue;
      }

      const url = String(project.project_url || "").trim();

      if (!url) {
        continue;
      }

      map.set(url, project);
    }

    // -------------------------------------------------------
    // 2. SQLite second
    // SQLite becomes the newer/preferred copy
    // -------------------------------------------------------

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

    return Array.from(map.values());
  }

  async function getSection(section) {
    const sectionName = String(section || "")
      .trim()
      .toLowerCase();

    if (!sectionName) {
      throw new Error("Section is required.");
    }

    console.log("[CoderBasketData] Loading section:", sectionName);

    // =======================================================
    // 1. LOAD LOCAL JSON FIRST
    // =======================================================

    let localItems = [];

    try {
      console.log("[CoderBasketData] Loading local JSON first:", sectionName);

      const fileName = `${sectionName}.json`;

      const url = `/data/${encodeURIComponent(fileName)}`;

      const response = await fetch(url, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Local JSON returned HTTP ${response.status}`);
      }

      const json = await response.json();

      if (Array.isArray(json)) {
        localItems = json;
      } else if (json && Array.isArray(json.Items)) {
        localItems = json.Items;
      } else if (json && Array.isArray(json.items)) {
        localItems = json.items;
      } else {
        throw new Error("Local JSON does not contain an array.");
      }

      console.log("[CoderBasketData] Local JSON loaded:", {
        section: sectionName,
        count: localItems.length,
      });
    } catch (error) {
      console.warn("[CoderBasketData] Local JSON failed:", error);
    }

    // =======================================================
    // 2. RETURN LOCAL DATA IMMEDIATELY IF SQLITE IS NOT READY
    // =======================================================

    // We don't wait for SQLite before showing local data.
    //
    // The caller gets the local catalogue immediately.
    //
    // SQLite synchronization happens below.

    // =======================================================
    // 3. LOAD SQLITE
    // =======================================================

    let databaseItems = [];

    try {
      console.log("[CoderBasketData] Loading SQLite:", sectionName);

      databaseItems = await CoderBasketDB.getAll(sectionName);

      console.log("[CoderBasketData] SQLite loaded:", {
        section: sectionName,
        count: databaseItems.length,
      });
    } catch (error) {
      console.warn("[CoderBasketData] SQLite unavailable:", error);

      // Local JSON remains usable.
      return localItems;
    }

    // =======================================================
    // 4. MERGE LOCAL + SQLITE
    // =======================================================

    const merged = mergeProjects(localItems, databaseItems);

    console.log("[CoderBasketData] Merged catalogue:", {
      section: sectionName,
      local: localItems.length,
      sqlite: databaseItems.length,
      merged: merged.length,
    });

    // =======================================================
    // 5. IF SQLITE IS EMPTY, DON'T NEED REMOTE YET
    // =======================================================

    if (databaseItems.length === 0) {
      console.log("[CoderBasketData] SQLite empty.");

      // Local JSON already contains the catalogue.
      //
      // We can optionally synchronize Apps Script here.
      // But don't block the initial catalogue.

      try {
        console.log("[CoderBasketData] Fetching Apps Script:", sectionName);

        const remoteItems = await getProjectsFromAppsScript(sectionName);

        if (Array.isArray(remoteItems) && remoteItems.length > 0) {
          console.log(
            "[CoderBasketData] Apps Script returned:",
            remoteItems.length,
          );

          // Save remote items to SQLite.

          await CoderBasketDB.saveMany(remoteItems);

          // Merge remote data with local data.

          return mergeProjects(localItems, remoteItems);
        }
      } catch (error) {
        console.warn(
          "[CoderBasketData] Apps Script synchronization failed:",
          error,
        );
      }
    }

    // =======================================================
    // 6. RETURN MERGED DATA
    // =======================================================

    return merged;
  }

  return {
    getSection,
  };
})();

//#endregion

//#endregion
