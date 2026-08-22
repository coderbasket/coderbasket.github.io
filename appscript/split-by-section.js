const fs = require("fs");
const path = require("path");

const INPUT_FILE =
  "C:\\Users\\Robel\\Documents\\projects\\coderbasket\\data\\frameworks.updated.json";

const OUTPUT_DIR =
  "C:\\Users\\Robel\\Documents\\projects\\coderbasket\\data\\frameworks-split";

// ---------------------------------------------------------
// Read input
// ---------------------------------------------------------

if (!fs.existsSync(INPUT_FILE)) {
  console.error(`✗ Input file not found:\n${INPUT_FILE}`);
  process.exit(1);
}

let projects;

try {
  const text = fs.readFileSync(INPUT_FILE, "utf8");
  projects = JSON.parse(text);
} catch (error) {
  console.error("✗ Could not read/parse JSON:");
  console.error(error.message);
  process.exit(1);
}

if (!Array.isArray(projects)) {
  console.error("✗ Input JSON must contain an array of projects.");
  process.exit(1);
}

console.log(`Loaded ${projects.length} projects.`);

// ---------------------------------------------------------
// Create output directory
// ---------------------------------------------------------

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ---------------------------------------------------------
// Group projects by section
// ---------------------------------------------------------

const sections = new Map();

for (const project of projects) {
  const section = String(project.section || "others").trim();

  if (!sections.has(section)) {
    sections.set(section, []);
  }

  sections.get(section).push(project);
}

// ---------------------------------------------------------
// Write each section
// ---------------------------------------------------------

console.log("\nWriting section files...\n");

for (const [section, items] of sections) {
  // Convert section name into a safe filename.
  const filename = section
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const outputFile = path.join(OUTPUT_DIR, `${filename || "others"}.json`);

  fs.writeFileSync(outputFile, JSON.stringify(items, null, 2), "utf8");

  console.log(`✓ ${filename}.json  (${items.length} projects)`);
}

// ---------------------------------------------------------
// Summary
// ---------------------------------------------------------

console.log("\n----------------------------------------");
console.log("Split complete");
console.log("----------------------------------------");
console.log(`Input:    ${INPUT_FILE}`);
console.log(`Projects: ${projects.length}`);
console.log(`Sections: ${sections.size}`);
console.log(`Output:   ${OUTPUT_DIR}`);
console.log("----------------------------------------\n");
