"use strict";

const fs = require("fs");
const path = require("path");

// ============================================================
// CODER BASKET - SUBMITTED TABLE → SECTION JSON SYNC
// ============================================================
//
// NEW SYNC ARCHITECTURE
// ---------------------
//
// We do NOT fetch one section at a time anymore.
//
// Instead:
//
//   Apps Script
//        │
//        ▼
//   Submitted table
//        │
//        │ contains items from MANY sections
//        ▼
//   sync-submitted.js
//        │
//        ├── group items by item.section
//        │
//        ├── section = "ai"
//        │       └── data/ai.json
//        │
//        ├── section = "flutter"
//        │       └── data/flutter.json
//        │
//        ├── section = "laravel"
//        │       └── data/laravel.json
//        │
//        └── section = "react"
//                └── data/react.json
//
// IMPORTANT:
//
// The SECTION PROPERTY controls the destination filename.
//
// Example:
//
//   item.section === "laravel"
//       ↓
//   data/laravel.json
//
// If the section JSON does not exist, it is created.
//
// If it already exists, the existing JSON is read and merged.
//
// The website does NOT contact Apps Script during normal loading.
//
// The website only loads:
//
//   data/<section>.json
//
// This script is intended to be run manually from the terminal
// whenever submitted data needs to be synchronized.
//
// ============================================================


// ============================================================
// CONFIG
// ============================================================


const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbywPDM_egWmshTchU72gBmC8e38MSgD0A0PhAgBz6x8qnezZq6ABrSTeB8VCbk0ayXv/exec";
const TABLE_NAME = "windows";
const PROJECT_ROOT = path.resolve(__dirname, "..");

const DATA_DIR = path.join(PROJECT_ROOT, "data");


// ============================================================
// HELPERS
// ============================================================

function log(...args) {
  console.log("[SYNC]", ...args);
}

function warn(...args) {
  console.warn("[SYNC]", ...args);
}

function fail(message, error) {
  console.error("[SYNC] ERROR:", message);

  if (error) {
    console.error(error);
  }

  process.exit(1);
}


// ============================================================
// SECTION VALIDATION
// ============================================================
//
// The section comes directly from Apps Script.
//
// It is also used as a filename.
//
// Therefore we MUST make sure the section is safe.
//
// Valid:
//
//   ai
//   flutter
//   react
//   react-native
//   kotlin-multiplatform
//
// Invalid:
//
//   ../something
//   ../../file
//   section/name
//   section name
//
// ============================================================

function isValidSection(section) {
  return /^[a-zA-Z0-9_-]+$/.test(section);
}


// ============================================================
// GET JSON FILE FOR SECTION
// ============================================================
//
// The filename is automatically determined by the section.
//
// Example:
//
//   getSectionJsonFile("ai")
//       → data/ai.json
//
//   getSectionJsonFile("laravel")
//       → data/laravel.json
//
// ============================================================

function getSectionJsonFile(section) {
  if (!isValidSection(section)) {
    throw new Error(`Invalid section name: "${section}"`);
  }

  return path.join(DATA_DIR, `${section}.json`);
}


// ============================================================
// FETCH SUBMITTED TABLE FROM APPS SCRIPT
// ============================================================
//
// IMPORTANT:
//
// This is the major change from the old script.
//
// OLD:
//
//   ?section=ai
//   ?section=flutter
//   ?section=react
//
// NEW:
//
//   Fetch the submitted table ONCE.
//
// The returned items may contain many different sections.
//
// Example:
//
// [
//   { section: "ai", ... },
//   { section: "laravel", ... },
//   { section: "react", ... },
//   { section: "ai", ... },
//   { section: "flutter", ... }
// ]
//
// We will group these items later.
//
// ============================================================

async function fetchSubmittedTable() {
  const url = `${APPS_SCRIPT_URL}?section=${TABLE_NAME}`;

  log("Fetching Apps Script submitted table...");
  log("URL:", url);

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Apps Script returned HTTP ${response.status}`,
    );
  }

  const result = await response.json();

  if (!result || result.success !== true) {
    throw new Error(
      result?.error ||
        "Apps Script failed to return submitted table.",
    );
  }

  if (!Array.isArray(result.items)) {
    throw new Error(
      "Apps Script returned an invalid items array.",
    );
  }

  return result.items;
}


// ============================================================
// GROUP ITEMS BY SECTION
// ============================================================
//
// Example input:
//
// [
//   { section: "ai", title: "A" },
//   { section: "laravel", title: "B" },
//   { section: "ai", title: "C" },
//   { section: "react", title: "D" }
// ]
//
// Becomes:
//
// {
//   ai: [
//     { section: "ai", title: "A" },
//     { section: "ai", title: "C" }
//   ],
//
//   laravel: [
//     { section: "laravel", title: "B" }
//   ],
//
//   react: [
//     { section: "react", title: "D" }
//   ]
// }
//
// ============================================================

function groupBySection(items) {
  const groups = new Map();

  for (const item of items) {
    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item)
    ) {
      warn("Skipping invalid submitted item:", item);
      continue;
    }

    const section = String(item.section || "").trim();

    if (!section) {
      warn(
        "Skipping item without section:",
        item,
      );

      continue;
    }

    if (!isValidSection(section)) {
      warn(
        `Skipping item with invalid section "${section}":`,
        item,
      );

      continue;
    }

    if (!groups.has(section)) {
      groups.set(section, []);
    }

    groups.get(section).push(item);
  }

  return groups;
}


// ============================================================
// READ LOCAL SECTION JSON
// ============================================================
//
// If the file DOES NOT exist:
//
//   return []
//
// The caller will then create the file.
//
// Example:
//
//   data/laravel.json does not exist
//
//   → localItems = []
//
// Then remote Laravel items are added and the file is created.
//
// ============================================================

function readLocalJson(section) {
  const jsonFile = getSectionJsonFile(section);

  if (!fs.existsSync(jsonFile)) {
    log(
      `[${section}] Local JSON does not exist. It will be created.`,
    );

    return [];
  }

  const raw = fs.readFileSync(jsonFile, "utf8");

  if (!raw.trim()) {
    return [];
  }

  let data;

  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Invalid JSON in ${jsonFile}: ${error.message}`,
    );
  }

  if (!Array.isArray(data)) {
    throw new Error(
      `${jsonFile} must contain a JSON array.`,
    );
  }

  return data;
}


// ============================================================
// PROJECT ID
// ============================================================
//
// PRIMARY IDENTITY:
//
//   project.id
//
// This is important.
//
// We do NOT use title as identity.
//
// We do NOT use section as identity.
//
// We do NOT use submitted_at as identity.
//
// We use the unique ID generated for the submitted project.
//
// Example:
//
//   f061ee40-0482-4cfa-996f-a2f1007fd128
//
// If an older JSON item does not have an ID, we use project_url
// as a backwards-compatible fallback.
//
// ============================================================

function getProjectId(project) {
  if (!project || typeof project !== "object") {
    return "";
  }

  const id = String(project.id || "").trim();

  if (id) {
    return id;
  }

  // ----------------------------------------------------------
  // Backwards compatibility for older JSON files.
  // ----------------------------------------------------------

  return String(
    project.project_url ||
      project.ProjectUrl ||
      project.projectUrl ||
      project.github_url ||
      project.GitHubUrl ||
      project.github ||
      "",
  )
    .trim()
    .toLowerCase();
}


// ============================================================
// VALIDATE ITEM
// ============================================================
//
// Validation is performed before adding/updating JSON.
//
// We intentionally do NOT generate submitted_at or updated_at.
//
// Those values belong to Apps Script.
//
// ============================================================

function validateItem(item, section) {
  if (
    !item ||
    typeof item !== "object" ||
    Array.isArray(item)
  ) {
    return "Item is not an object.";
  }

  const requiredStrings = [
    "project_url",
    "title",
    "description",
    "section",
    "section_category",
  ];

  for (const field of requiredStrings) {
    if (
      typeof item[field] !== "string" ||
      !item[field].trim()
    ) {
      return `${field} is required.`;
    }
  }

  // ----------------------------------------------------------
  // The item must belong to the section currently being synced.
  // ----------------------------------------------------------

  if (item.section !== section) {
    return (
      `Section mismatch. Expected "${section}", ` +
      `received "${item.section}".`
    );
  }

  // ----------------------------------------------------------
  // Arrays
  // ----------------------------------------------------------

  if (
    !Array.isArray(item.technologies) ||
    !Array.isArray(item.platforms) ||
    !Array.isArray(item.categories)
  ) {
    return (
      "technologies, platforms and categories " +
      "must be arrays."
    );
  }

  return null;
}


// ============================================================
// MERGE ONE SECTION
// ============================================================
//
// Existing projects:
//     UPDATE
//
// New projects:
//     ADD
//
// Existing ordering:
//     PRESERVED
//
// New projects:
//     APPENDED
//
// Records already in the local JSON but not present in the
// submitted-table response are NOT deleted.
//
// This is important because the local JSON is a growing
// catalogue.
//
// ============================================================

function mergeProjects(localItems, remoteItems, section) {
  const result = [...localItems];

  const indexById = new Map();

  // ----------------------------------------------------------
  // Index existing local records.
  // ----------------------------------------------------------

  for (let i = 0; i < result.length; i++) {
    const id = getProjectId(result[i]);

    if (id) {
      indexById.set(id, i);
    }
  }

  let added = 0;
  let updated = 0;
  let skipped = 0;

  // ----------------------------------------------------------
  // Process Apps Script records.
  // ----------------------------------------------------------

  for (const item of remoteItems) {
    const validationError = validateItem(
      item,
      section,
    );

    if (validationError) {
      warn(
        `[${section}] Skipping invalid item:`,
        validationError,
        item,
      );

      skipped++;
      continue;
    }

    const id = getProjectId(item);

    if (!id) {
      warn(
        `[${section}] Skipping item without ID/project_url:`,
        item.title,
      );

      skipped++;
      continue;
    }

    // --------------------------------------------------------
    // EXISTING PROJECT
    // --------------------------------------------------------

    if (indexById.has(id)) {
      const index = indexById.get(id);

      //
      // Merge the new Apps Script data over the existing item.
      //
      // This means:
      //
      // submitted_at:
      //     Comes from Apps Script and is preserved.
      //
      // updated_at:
      //     Comes from Apps Script and gets updated.
      //
      // Other fields:
      //     Updated from Apps Script.
      //
      result[index] = {
        ...result[index],
        ...item,
      };

      updated++;
    }

    // --------------------------------------------------------
    // NEW PROJECT
    // --------------------------------------------------------

    else {
      indexById.set(id, result.length);

      result.push(item);

      added++;
    }
  }

  return {
    result,
    added,
    updated,
    skipped,
  };
}


// ============================================================
// WRITE SECTION JSON
// ============================================================
//
// Creates:
//
//   data/<section>.json
//
// if it doesn't already exist.
//
// ============================================================

function writeSectionJson(section, data) {
  const jsonFile = getSectionJsonFile(section);

  fs.mkdirSync(DATA_DIR, {
    recursive: true,
  });

  fs.writeFileSync(
    jsonFile,
    JSON.stringify(data, null, 2) + "\n",
    "utf8",
  );

  return jsonFile;
}


// ============================================================
// SYNC ONE SECTION
// ============================================================

function syncSection(section, remoteItems) {
  log("----------------------------------------");
  log(`Processing section: ${section}`);

  const jsonFile = getSectionJsonFile(section);

  log("Target:", jsonFile);
  log("Remote items:", remoteItems.length);

  // ----------------------------------------------------------
  // READ EXISTING JSON
  // ----------------------------------------------------------

  const localItems = readLocalJson(section);

  log("Existing local items:", localItems.length);

  // ----------------------------------------------------------
  // MERGE
  // ----------------------------------------------------------

  const {
    result,
    added,
    updated,
    skipped,
  } = mergeProjects(
    localItems,
    remoteItems,
    section,
  );

  // ----------------------------------------------------------
  // WRITE
  // ----------------------------------------------------------

  writeSectionJson(section, result);

  // ----------------------------------------------------------
  // RESULT
  // ----------------------------------------------------------

  log(`[${section}] Added:`, added);
  log(`[${section}] Updated:`, updated);
  log(`[${section}] Skipped:`, skipped);
  log(`[${section}] Before:`, localItems.length);
  log(`[${section}] After:`, result.length);

  return {
    section,
    added,
    updated,
    skipped,
    before: localItems.length,
    after: result.length,
    file: jsonFile,
  };
}


// ============================================================
// MAIN
// ============================================================
//
// ONE TERMINAL COMMAND:
//
//   node appscript/sync-submitted.js
//
// No section argument is required.
//
// The script automatically discovers sections from the
// submitted table.
//
// ============================================================

async function main() {
  log("========================================");
  log("Coder Basket Submitted Table Sync");
  log("========================================");

  // ----------------------------------------------------------
  // 1. FETCH ENTIRE SUBMITTED TABLE
  // ----------------------------------------------------------

  const remoteItems = await fetchSubmittedTable();

  log(
    "Apps Script returned:",
    remoteItems.length,
    "items",
  );

  // ----------------------------------------------------------
  // 2. GROUP ITEMS BY SECTION
  // ----------------------------------------------------------

  const groups = groupBySection(remoteItems);

  log(
    "Sections discovered:",
    groups.size,
  );

  for (const [section, items] of groups) {
    log(
      `  ${section}: ${items.length} items`,
    );
  }

  // ----------------------------------------------------------
  // 3. SYNC EACH SECTION
  // ----------------------------------------------------------

  const summaries = [];

  for (const [section, items] of groups) {
    const summary = syncSection(
      section,
      items,
    );

    summaries.push(summary);
  }

  // ----------------------------------------------------------
  // 4. FINAL SUMMARY
  // ----------------------------------------------------------

  let totalAdded = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const summary of summaries) {
    totalAdded += summary.added;
    totalUpdated += summary.updated;
    totalSkipped += summary.skipped;
  }

  log("========================================");
  log("SYNC COMPLETE");
  log("========================================");

  log("Sections:", summaries.length);
  log("Remote items:", remoteItems.length);
  log("Added:", totalAdded);
  log("Updated:", totalUpdated);
  log("Skipped:", totalSkipped);

  log("----------------------------------------");

  for (const summary of summaries) {
    log(
      `${summary.section}.json`,
      `Added=${summary.added}`,
      `Updated=${summary.updated}`,
      `Skipped=${summary.skipped}`,
      `Before=${summary.before}`,
      `After=${summary.after}`,
    );
  }

  log("========================================");
}


// ============================================================
// RUN
// ============================================================

main().catch((error) => {
  fail(
    "Failed to synchronize submitted table.",
    error,
  );
});