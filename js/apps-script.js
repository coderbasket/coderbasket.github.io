
//#region Appscript
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwM2yNRBQQaVLnxioQSwjRMvhbZ3flROaXNsO6rrvFrU72ogsXHnd_GJ26rYru63hwV/exec";


async function fetchSectionFromAppsScript(section) {
  const sectionName = String(section || "").trim();

  if (!sectionName) {
    throw new Error("Section is required.");
  }

  const url =
    `${APPS_SCRIPT_URL}?sheet=${encodeURIComponent(sectionName)}`;

  console.log(
    "[CoderBasketDB] Fetching section:",
    sectionName
  );

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Apps Script returned HTTP ${response.status}`
    );
  }

  const result = await response.json();

  console.log(
    "[CoderBasketDB] Apps Script response:",
    result
  );

  if (!result.success) {
    throw new Error(
      result.error ||
      "Apps Script failed to return projects."
    );
  }

  if (!Array.isArray(result.items)) {
    throw new Error(
      "Apps Script returned an invalid items array."
    );
  }

  return result.items;
}


function validateGeneratedJson(data) {
  const errors = [];

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    errors.push("Generated data is not a valid object.");
    return errors;
  }

  // =========================================================
  // Required string fields
  // =========================================================

  const requiredStrings = [
    "project_url",
    "title",
    "description",
    "section",
    "section_category",
  ];

  for (const field of requiredStrings) {
    if (typeof data[field] !== "string" || !data[field].trim()) {
      errors.push(`${field} is required.`);
    }
  }

  // =========================================================
  // Section / Sheet name
  // =========================================================

  if (data.section) {
    const section = data.section.trim();

    if (!/^[a-zA-Z0-9_-]+$/.test(section)) {
      errors.push(
        "section must contain only letters, numbers, underscores, or hyphens.",
      );
    }

    if (section.length > 100) {
      errors.push("section must not exceed 100 characters.");
    }
  }

  // =========================================================
  // GitHub repository URL
  // =========================================================

  if (
    data.project_url &&
    !/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(data.project_url)
  ) {
    errors.push("project_url must be a valid GitHub repository URL.");
  }

  // =========================================================
  // Arrays
  // =========================================================

  const arrayFields = ["technologies", "platforms", "categories"];

  for (const field of arrayFields) {
    if (!Array.isArray(data[field])) {
      errors.push(`${field} must be an array.`);
    }
  }

  // =========================================================
  // Optional URLs
  // =========================================================

  const optionalUrls = ["external_url", "youtube_url", "image_url"];

  for (const field of optionalUrls) {
    const value = data[field];

    if (value !== null && value !== undefined && typeof value !== "string") {
      errors.push(`${field} must be a string or null.`);
    }
  }

  // =========================================================
  // GitHub object
  // =========================================================

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
      errors.push("github.topics must be an array.");
    }
  }

  return errors;
}

async function getProjectsFromAppsScript(section) {
  const sectionName = String(section || "").trim();

  if (!sectionName) {
    throw new Error("Section is required.");
  }

  const url =
    `${APPS_SCRIPT_URL}?sheet=${encodeURIComponent(sectionName)}`;

  console.log(
    "[AppsScript] Fetching section:",
    sectionName
  );

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Apps Script returned HTTP ${response.status}`
    );
  }

  const result = await response.json();

  console.log(
    "[AppsScript] Response:",
    result
  );

  if (!result.success) {
    throw new Error(
      result.error ||
      "Apps Script failed to return projects."
    );
  }

  if (!Array.isArray(result.items)) {
    throw new Error(
      "Apps Script returned an invalid items array."
    );
  }

  return result.items;
}
//#endregion
