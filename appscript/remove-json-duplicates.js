// remove-json-duplicates.js

const fs = require("fs");
const path = require("path");

const DATA_DIR =
  "C:\\Users\\Robel\\Documents\\projects\\coderbasket\\data";

function normalizeProjectUrl(url) {
  if (!url) return null;

  return String(url)
    .trim()
    .toLowerCase()
    .replace(/\/+$/, "");
}

function removeDuplicates(data) {
  if (!Array.isArray(data)) {
    return {
      data,
      removed: 0,
      originalCount: null,
      finalCount: null,
    };
  }

  const seen = new Set();
  const unique = [];
  let removed = 0;

  for (const item of data) {
    const projectUrl = normalizeProjectUrl(item?.project_url);

    // Only use project_url to identify duplicates.
    // Entries without project_url are preserved.
    if (!projectUrl) {
      unique.push(item);
      continue;
    }

    if (seen.has(projectUrl)) {
      removed++;
      continue;
    }

    seen.add(projectUrl);
    unique.push(item);
  }

  return {
    data: unique,
    removed,
    originalCount: data.length,
    finalCount: unique.length,
  };
}

function processJsonFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(raw);

    const result = removeDuplicates(json);

    // JSON isn't an array.
    if (result.originalCount === null) {
      console.log(`SKIP  ${filePath}`);
      console.log("      JSON root is not an array.");
      return;
    }

    if (result.removed === 0) {
      console.log(
        `OK    ${filePath} (${result.finalCount} projects, no duplicates)`
      );
      return;
    }

    fs.writeFileSync(
      filePath,
      JSON.stringify(result.data, null, 2) + "\n",
      "utf8"
    );

    console.log(`FIXED ${filePath}`);
    console.log(`      Before : ${result.originalCount}`);
    console.log(`      After  : ${result.finalCount}`);
    console.log(`      Removed: ${result.removed}`);
  } catch (error) {
    console.error(`ERROR ${filePath}`);
    console.error(`       ${error.message}`);
  }
}

function scanDirectory(directory) {
  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
      continue;
    }

    if (
      entry.isFile() &&
      path.extname(entry.name).toLowerCase() === ".json"
    ) {
      processJsonFile(fullPath);
    }
  }
}

console.log("========================================");
console.log("JSON PROJECT DUPLICATE CLEANER");
console.log("========================================");
console.log(`Directory: ${DATA_DIR}`);
console.log("Duplicate key: project_url");
console.log("");

if (!fs.existsSync(DATA_DIR)) {
  console.error("Directory does not exist.");
  process.exit(1);
}

scanDirectory(DATA_DIR);

console.log("");
console.log("========================================");
console.log("DONE");
console.log("========================================");