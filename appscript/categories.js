"use strict";

const fs = require("fs");
const path = require("path");

// ============================================================
// CONFIG
// ============================================================

const DATA_DIR =
  "C:\\Users\\Robel\\Documents\\projects\\coderbasket\\data";

// Set to true to create .bak files before modifying JSON.
const CREATE_BACKUP = true;

// ============================================================
// CATEGORY MAP
// ============================================================

const CATEGORIES = {
  1: "About",
  2: "Activity Feeds",
  3: "Calculators",
  4: "Calendars & Time",
  5: "Cards",
  6: "Charts",
  7: "Comments",
  8: "Dashboard",
  9: "Filter",
  10: "Friends",
  11: "Launch Screen",
  12: "Lists",
  13: "Login",
  14: "Maps",
  15: "Messaging",
  16: "Navigations",
  17: "Notifications",
  18: "Photos",
  19: "Playback",
  20: "Popovers",
  21: "Products",
  22: "Profiles",
  23: "Search",
  24: "Settings",
  25: "Share",
  26: "Shopping Cart",
  27: "Sidebars",
  28: "Signups",
  29: "Tabbars",
  30: "Timeline",
  31: "Walkthroughs",
  32: "Widgets",
  33: "Data Grid",
  34: "App Clone",
  35: "Articles",
  36: "Errors",
  37: "Stores",
  38: "Neomorphism",
  39: "Social Network",
  40: "Carousel",

  41: "Others",
  42: "Tools",
  43: "Games",
  44: "Animations",
  45: "Controls",
  46: "Libraries",

  47: "LLM",
  48: "AI Agents",
  49: "RAG",
  50: "Computer Vision",
  51: "Speech & Audio",
  52: "Local AI",
  53: "Generative AI",
  54: "AI Assistants",
  55: "AI Automation",
  56: "AI Chat",
  57: "AI Coding",
  58: "AI Search",
  59: "AI Image Generation",
  60: "AI Video Generation",
  61: "AI Music",
  62: "AI Embeddings",
  63: "AI Models",
  64: "Model Training",
  65: "Model Evaluation",

  66: "Machine Learning",
  67: "Deep Learning",
  68: "Natural Language Processing",
  69: "Recommendation Systems",
  70: "Classification",
  71: "Object Detection",
  72: "Image Classification",
  73: "Speech Recognition",
  74: "Text to Speech",
  75: "Data Science",

  76: "Developer Tools",
  77: "Development Environment",
  78: "Code Editor",
  79: "Debugging",
  80: "Testing",
  81: "Profiling",
  82: "API",
  83: "REST API",
  84: "GraphQL",
  85: "CLI",
  86: "Command Line",
  87: "Package Manager",
  88: "Build Tools",
  89: "Compilers",
  90: "Code Generators",

  91: "Web Development",
  92: "JavaScript",
  93: "TypeScript",
  94: "HTML",
  95: "CSS",
  96: "Frontend",
  97: "Backend",
  98: "Full Stack",
  99: "Web Components",
  100: "Progressive Web Apps",
  101: "WebAssembly",

  102: "Databases",
  103: "SQLite",
  104: "PostgreSQL",
  105: "MySQL",
  106: "NoSQL",
  107: "Data Processing",
  108: "Data Visualization",
  109: "Data Import",
  110: "Data Export",

  111: "Cloud",
  112: "Cloud Computing",
  113: "Cloud Storage",
  114: "Serverless",
  115: "Containers",
  116: "Docker",
  117: "Kubernetes",
  118: "DevOps",
  119: "CI/CD",
  120: "Monitoring",

  121: "Security",
  122: "Authentication",
  123: "Authorization",
  124: "Encryption",
  125: "Privacy",

  126: "Audio",
  127: "Video",
  128: "Image Processing",
  129: "Image Editing",
  130: "Media Player",
  131: "Streaming",
  132: "Recording",
  133: "Audio Processing",

  134: "Productivity",
  135: "Notes",
  136: "Task Management",
  137: "File Management",
  138: "Document Management",
  139: "Text Editing",
  140: "Time Tracking",

  141: "UI Libraries",
  142: "Design Systems",
  143: "Themes",
  144: "Dark Mode",
  145: "Light Mode",
  146: "Responsive Design",
  147: "Accessibility",
  148: "Material Design",
  149: "Fluent Design",

  150: "Networking",
  151: "HTTP",
  152: "WebSocket",
  153: "Networking Tools",
  154: "Download Managers",
  155: "Remote Access",

  156: "Education",
  157: "Learning",
  158: "Documentation",
  159: "Tutorials",
  160: "Reference",

  161: "Utilities",
  162: "File Utilities",
  163: "System Utilities",
  164: "Converters",
  165: "Generators",
  166: "Parsers",
  167: "Formatters",
  168: "Validators",

  169: "Architecture",
  170: "Frameworks",
  171: "Libraries & SDKs",
  172: "Components",
  173: "Plugins",
  174: "Extensions",
  175: "Templates",

  176: "Cross Platform",
  177: "Desktop",
  178: "Mobile",
  179: "Windows",
  180: "macOS",
  181: "Linux",
  182: "Android",
  183: "iOS",

  184: "Open Source",
  185: "Experimental",
  186: "Educational",
  187: "Reference Implementation",
  188: "Samples",
  189: "Starter Projects",
};

// ============================================================
// RECURSIVELY FIND JSON FILES
// ============================================================

function findJsonFiles(directory) {
  const files = [];

  for (const entry of fs.readdirSync(directory, {
    withFileTypes: true,
  })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...findJsonFiles(fullPath));
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.toLowerCase().endsWith(".json") &&
      !entry.name.endsWith(".bak")
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

// ============================================================
// CONVERT CATEGORIES
// ============================================================

function convertCategories(categories, filePath) {
  if (!Array.isArray(categories)) {
    return categories;
  }

  return categories.map((category) => {
    // Already text — leave it alone.
    if (typeof category === "string") {
      return category;
    }

    // Numeric category ID.
    if (typeof category === "number") {
      const name = CATEGORIES[category];

      if (!name) {
        console.warn(
          `  ⚠ Unknown category ID ${category} in ${filePath}`
        );

        // Preserve unknown value instead of destroying data.
        return category;
      }

      return name;
    }

    return category;
  });
}

// ============================================================
// RECURSIVELY PROCESS JSON
// ============================================================

function processValue(value, filePath) {
  if (Array.isArray(value)) {
    return value.map((item) =>
      processValue(item, filePath)
    );
  }

  if (value && typeof value === "object") {
    const result = {};

    for (const [key, child] of Object.entries(value)) {
      if (key === "categories") {
        result[key] = convertCategories(
          child,
          filePath
        );
      } else {
        result[key] = processValue(child, filePath);
      }
    }

    return result;
  }

  return value;
}

// ============================================================
// PROCESS ONE FILE
// ============================================================

function processFile(filePath) {
  console.log("");
  console.log(`Processing: ${filePath}`);

  let originalText;

  try {
    originalText = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    console.error(`  ✗ Could not read file: ${error.message}`);
    return {
      success: false,
      changed: false,
    };
  }

  let data;

  try {
    data = JSON.parse(originalText);
  } catch (error) {
    console.error(`  ✗ Invalid JSON: ${error.message}`);

    return {
      success: false,
      changed: false,
    };
  }

  const converted = processValue(data, filePath);

  const newText =
    JSON.stringify(converted, null, 2) + "\n";

  if (newText === originalText) {
    console.log("  ✓ No changes needed.");

    return {
      success: true,
      changed: false,
    };
  }

  // ----------------------------------------------------------
  // Backup
  // ----------------------------------------------------------

  if (CREATE_BACKUP) {
    const backupPath = `${filePath}.bak`;

    try {
      fs.writeFileSync(
        backupPath,
        originalText,
        "utf8"
      );

      console.log(`  ✓ Backup: ${backupPath}`);
    } catch (error) {
      console.error(
        `  ✗ Could not create backup: ${error.message}`
      );

      return {
        success: false,
        changed: false,
      };
    }
  }

  // ----------------------------------------------------------
  // Write converted JSON
  // ----------------------------------------------------------

  try {
    fs.writeFileSync(
      filePath,
      newText,
      "utf8"
    );

    console.log("  ✓ Categories converted.");

    return {
      success: true,
      changed: true,
    };
  } catch (error) {
    console.error(
      `  ✗ Could not write file: ${error.message}`
    );

    return {
      success: false,
      changed: false,
    };
  }
}

// ============================================================
// MAIN
// ============================================================

console.log("");
console.log("================================================");
console.log(" Coder Basket - Category ID → Text Migration");
console.log("================================================");
console.log("");

if (!fs.existsSync(DATA_DIR)) {
  console.error("Data directory does not exist:");
  console.error(DATA_DIR);
  process.exit(1);
}

console.log(`Scanning: ${DATA_DIR}`);

const jsonFiles = findJsonFiles(DATA_DIR);

console.log(`Found ${jsonFiles.length} JSON file(s).`);

let changed = 0;
let unchanged = 0;
let failed = 0;

for (const filePath of jsonFiles) {
  const result = processFile(filePath);

  if (!result.success) {
    failed++;
  } else if (result.changed) {
    changed++;
  } else {
    unchanged++;
  }
}

console.log("");
console.log("================================================");
console.log(" COMPLETE");
console.log("================================================");
console.log("");
console.log(`JSON files found : ${jsonFiles.length}`);
console.log(`Files changed    : ${changed}`);
console.log(`Files unchanged  : ${unchanged}`);
console.log(`Files failed     : ${failed}`);
console.log("");

if (CREATE_BACKUP) {
  console.log("Original files were backed up as:");
  console.log("*.json.bak");
  console.log("");
}

console.log("Done.");