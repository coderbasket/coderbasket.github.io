//#region Appscript

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbywPDM_egWmshTchU72gBmC8e38MSgD0A0PhAgBz6x8qnezZq6ABrSTeB8VCbk0ayXv/exec";

// ============================================================
// GET ALL TABLE / SECTION NAMES
//
// Apps Script:
// ?tablenames
//
// Example response:
// {
//   success: true,
//   count: 20,
//   tablenames: [
//     "ai",
//     "flutter",
//         "dotnet",
//     "react",
//     "react-native",
//     ...
//   ]
// }
//
// IMPORTANT:
// Section names are returned exactly as they exist in
// Google Sheets. No renaming or transformation is performed.
// ============================================================

async function getTableNamesFromAppsScript() {
  const url = `${APPS_SCRIPT_URL}?tablenames`;

  console.log("[AppsScript] Fetching table names:", url);

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

  console.log("[AppsScript] Table names response:", result);

  if (!result || result.success !== true) {
    throw new Error(
      result?.error ||
        "Apps Script failed to return table names.",
    );
  }

  if (!Array.isArray(result.tablenames)) {
    throw new Error(
      "Apps Script returned an invalid tablenames array.",
    );
  }

  // ----------------------------------------------------------
  // Keep section names EXACTLY as Apps Script returned them.
  //
  // Only remove invalid empty values and duplicate values.
  // No renaming.
  // ----------------------------------------------------------

  const tableNames = [
    ...new Set(
      result.tablenames
        .map((name) => String(name ?? "").trim())
        .filter(Boolean),
    ),
  ];

  console.log(
    "[AppsScript] Available sections:",
    tableNames,
  );

  return tableNames;
}

// ============================================================
// GET PROJECTS FROM ONE SECTION
//
// Apps Script:
// ?section=react
//
// IMPORTANT:
// "react" and "react-native" are completely independent.
//
// ?section=react
//      -> React sheet only
//
// ?section=react-native
//      -> React Native sheet only
//
// The frontend does NOT rename or normalize the section name.
// ============================================================

async function fetchSectionFromAppsScript(section) {
  const sectionName = String(section || "").trim();

  if (!sectionName) {
    throw new Error("Section is required.");
  }

  const url =
    `${APPS_SCRIPT_URL}?section=${encodeURIComponent(sectionName)}`;

  console.log(
    "[AppsScript] Fetching section:",
    sectionName,
  );

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

  console.log(
    "[AppsScript] Section response:",
    result,
  );

  if (!result || result.success !== true) {
    throw new Error(
      result?.error ||
        `Apps Script failed to return section "${sectionName}".`,
    );
  }

  if (!Array.isArray(result.items)) {
    throw new Error(
      "Apps Script returned an invalid items array.",
    );
  }

  // ----------------------------------------------------------
  // IMPORTANT:
  //
  // Do not rename the section.
  //
  // We trust the section returned by Apps Script.
  // If the API did not include one on an old row, use the
  // requested section as the fallback.
  // ----------------------------------------------------------

  return result.items.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return item;
    }

    return {
      ...item,
      section:
        typeof item.section === "string" && item.section.trim()
          ? item.section
          : sectionName,
    };
  });
}

// ============================================================
// ALIAS
//
// Existing code can continue calling:
//
// getProjectsFromAppsScript("react")
//
// No other code needs to change.
// ============================================================

async function getProjectsFromAppsScript(section) {
  return fetchSectionFromAppsScript(section);
}

// ============================================================
// VALIDATE PROJECT DATA
// ============================================================

function validateGeneratedJson(data) {
  const errors = [];

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    errors.push("Generated data is not a valid object.");
    return errors;
  }

  // ==========================================================
  // Required string fields
  // ==========================================================

  const requiredStrings = [
    "project_url",
    "title",
    "description",
    "section",
    "section_category",
  ];

  for (const field of requiredStrings) {
    if (
      typeof data[field] !== "string" ||
      !data[field].trim()
    ) {
      errors.push(`${field} is required.`);
    }
  }

  // ==========================================================
  // Section / Sheet name
  //
  // IMPORTANT:
  // Validation only.
  //
  // We DO NOT rename the section.
  // ==========================================================

  if (data.section) {
    const section = data.section.trim();

    if (!/^[a-zA-Z0-9_-]+$/.test(section)) {
      errors.push(
        "section must contain only letters, numbers, underscores, or hyphens.",
      );
    }

    if (section.length > 100) {
      errors.push(
        "section must not exceed 100 characters.",
      );
    }
  }

  // ==========================================================
  // GitHub repository URL
  // ==========================================================

  if (
    data.project_url &&
    !/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(
      data.project_url,
    )
  ) {
    errors.push(
      "project_url must be a valid GitHub repository URL.",
    );
  }

  // ==========================================================
  // Arrays
  // ==========================================================

  const arrayFields = [
    "technologies",
    "platforms",
    "categories",
  ];

  for (const field of arrayFields) {
    if (!Array.isArray(data[field])) {
      errors.push(`${field} must be an array.`);
    }
  }

  // ==========================================================
  // Optional URLs
  // ==========================================================

  const optionalUrls = [
    "external_url",
    "youtube_url",
    "image_url",
  ];

  for (const field of optionalUrls) {
    const value = data[field];

    if (
      value !== null &&
      value !== undefined &&
      typeof value !== "string"
    ) {
      errors.push(
        `${field} must be a string or null.`,
      );
    }
  }

  // ==========================================================
  // GitHub object
  // ==========================================================

  if (
    !data.github ||
    typeof data.github !== "object" ||
    Array.isArray(data.github)
  ) {
    errors.push("github information is required.");
  } else {
    if (typeof data.github.stars !== "number") {
      errors.push("github.stars must be a number.");
    }

    if (typeof data.github.forks !== "number") {
      errors.push("github.forks must be a number.");
    }

    if (typeof data.github.watchers !== "number") {
      errors.push("github.watchers must be a number.");
    }

    if (!Array.isArray(data.github.topics)) {
      errors.push(
        "github.topics must be an array.",
      );
    }
  }

  return errors;
}

//#endregion