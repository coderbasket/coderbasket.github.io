"use strict";

/*
 * Coder Basket
 * Catalogue data configuration
 *
 * Physical development folder:
 * C:\Users\Robel\Documents\projects\coderbasket\data\
 *
 * Catalogue:
 * /data/ai.json
 * /data/dotnet.json
 * /data/flutter.json
 * /data/frameworks.json
 */

const DATA_BASE_URL = "/data/";

const DATA_SECTIONS = {
  ai: {
    name: "AI",
    file: "ai.json",
    path: "/ai/",
  },

  dotnet: {
    name: ".NET",
    file: "dotnet.json",
    path: "/dotnet/",
  },

  flutter: {
    name: "Flutter",
    file: "flutter.json",
    path: "/flutter/",
  },

  frameworks: {
    name: "Frameworks",
    file: "frameworks.json",
    path: "/",
  },
};

/*
 * Virtual framework pages.
 *
 * Each framework uses frameworks.json as its data source.
 */
const FRAMEWORKS = {
  kotlin: {
    name: "Kotlin",
    path: "/kotlin/",
    dataSource: "frameworks",
  },

  react: {
    name: "React",
    path: "/react/",
    dataSource: "frameworks",
  },

  "react-native": {
    name: "React Native",
    path: "/react-native/",
    dataSource: "frameworks",
  },

  vue: {
    name: "Vue",
    path: "/vue/",
    dataSource: "frameworks",
  },

  angular: {
    name: "Angular",
    path: "/angular/",
    dataSource: "frameworks",
  },

  svelte: {
    name: "Svelte",
    path: "/svelte/",
    dataSource: "frameworks",
  },

  nextjs: {
    name: "Next.js",
    path: "/nextjs/",
    dataSource: "frameworks",
  },

  nuxt: {
    name: "Nuxt",
    path: "/nuxt/",
    dataSource: "frameworks",
  },

  electron: {
    name: "Electron",
    path: "/electron/",
    dataSource: "frameworks",
  },

  tauri: {
    name: "Tauri",
    path: "/tauri/",
    dataSource: "frameworks",
  },

  "kotlin-multiplatform": {
    name: "Kotlin Multiplatform",
    path: "/kotlin-multiplatform/",
    dataSource: "frameworks",
  },

  laravel: {
    name: "Laravel",
    path: "/laravel/",
    dataSource: "frameworks",
  },

  django: {
    name: "Django",
    path: "/django/",
    dataSource: "frameworks",
  },

  spring: {
    name: "Spring",
    path: "/spring/",
    dataSource: "frameworks",
  },

  "ruby-on-rails": {
    name: "Ruby on Rails",
    path: "/ruby-on-rails/",
    dataSource: "frameworks",
  },
};

/* =======================================================
   MAIN NAVIGATION
======================================================= */

const NAVIGATION = {
  home: {
    name: "Home",
    path: "/",
  },

  tools: {
    name: "Tools",
    path: "/tools/",
  },

  about: {
    name: "About",
    path: "/about/",
  },
};

/* =======================================================
   SECTION DISPLAY ORDER
======================================================= */

const DATA_SECTION_ORDER = ["ai", "flutter", "dotnet"];

/*
 * Application categories.
 *
 * These are the category IDs stored inside project JSON files.
 */

const CATEGORIES = {
  /* =====================================================
     APP / UI
  ===================================================== */

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

  /* =====================================================
     GENERAL
  ===================================================== */

  41: "Others",
  42: "Tools",
  43: "Games",
  44: "Animations",
  45: "Controls",
  46: "Libraries",

  /* =====================================================
     AI
  ===================================================== */

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

  /* =====================================================
     MACHINE LEARNING
  ===================================================== */

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

  /* =====================================================
     DEVELOPMENT
  ===================================================== */

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

  /* =====================================================
     WEB
  ===================================================== */

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

  /* =====================================================
     DATA
  ===================================================== */

  102: "Databases",
  103: "SQLite",
  104: "PostgreSQL",
  105: "MySQL",
  106: "NoSQL",
  107: "Data Processing",
  108: "Data Visualization",
  109: "Data Import",
  110: "Data Export",

  /* =====================================================
     CLOUD / INFRASTRUCTURE
  ===================================================== */

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

  /* =====================================================
     SECURITY
  ===================================================== */

  121: "Security",
  122: "Authentication",
  123: "Authorization",
  124: "Encryption",
  125: "Privacy",

  /* =====================================================
     MEDIA
  ===================================================== */

  126: "Audio",
  127: "Video",
  128: "Image Processing",
  129: "Image Editing",
  130: "Media Player",
  131: "Streaming",
  132: "Recording",
  133: "Audio Processing",

  /* =====================================================
     PRODUCTIVITY
  ===================================================== */

  134: "Productivity",
  135: "Notes",
  136: "Task Management",
  137: "File Management",
  138: "Document Management",
  139: "Text Editing",
  140: "Time Tracking",

  /* =====================================================
     UI / DESIGN
  ===================================================== */

  141: "UI Libraries",
  142: "Design Systems",
  143: "Themes",
  144: "Dark Mode",
  145: "Light Mode",
  146: "Responsive Design",
  147: "Accessibility",
  148: "Material Design",
  149: "Fluent Design",

  /* =====================================================
     NETWORKING
  ===================================================== */

  150: "Networking",
  151: "HTTP",
  152: "WebSocket",
  153: "Networking Tools",
  154: "Download Managers",
  155: "Remote Access",

  /* =====================================================
     EDUCATION
  ===================================================== */

  156: "Education",
  157: "Learning",
  158: "Documentation",
  159: "Tutorials",
  160: "Reference",

  /* =====================================================
     UTILITIES
  ===================================================== */

  161: "Utilities",
  162: "File Utilities",
  163: "System Utilities",
  164: "Converters",
  165: "Generators",
  166: "Parsers",
  167: "Formatters",
  168: "Validators",

  /* =====================================================
     ARCHITECTURE
  ===================================================== */

  169: "Architecture",
  170: "Frameworks",
  171: "Libraries & SDKs",
  172: "Components",
  173: "Plugins",
  174: "Extensions",
  175: "Templates",

  /* =====================================================
     PLATFORMS
  ===================================================== */

  176: "Cross Platform",
  177: "Desktop",
  178: "Mobile",
  179: "Windows",
  180: "macOS",
  181: "Linux",
  182: "Android",
  183: "iOS",

  /* =====================================================
     OTHER
  ===================================================== */

  184: "Open Source",
  185: "Experimental",
  186: "Educational",
  187: "Reference Implementation",
  188: "Samples",
  189: "Starter Projects",
};

/*
 * Default section.
 */

const DEFAULT_SECTION = "ai";

/*
 * Local-storage keys.
 */

const STORAGE_KEYS = {
  section: "coderbasket.selectedSection",
  subCategory: "coderbasket.selectedSubCategory",
  category: "coderbasket.selectedCategory",
};

function getCategoryIcon(categoryKey) {
  const icons = {
    // AI
    llm: "/assets/icons/llm.svg",
    agents: "/assets/icons/agents.svg",
    rag: "/assets/icons/rag.svg",
    vision: "/assets/icons/vision.svg",
    speech: "/assets/icons/speech.svg",
    "local-ai": "/assets/icons/local-ai.svg",

    // .NET
    maui: "/assets/icons/maui.svg",
    avalonia: "/assets/icons/avalonia.svg",
    uno: "/assets/icons/uno.svg",

    // Web
    javascript: "/assets/icons/javascript.svg",
    typescript: "/assets/icons/typescript.svg",
    css: "/assets/icons/css.svg",

    // Flutter
    flutter: "/assets/icons/flutter.svg",
    material: "/assets/icons/material.svg",
    cupertino: "/assets/icons/cupertino.svg",
    firebase: "/assets/icons/firebase.svg",

    // Generic
    others: "/assets/icons/others.svg",
  };

  return icons[categoryKey] || "/assets/icons/default.png";
}
function handleImageError(image, categoryKey) {
  const stage = image.dataset.fallbackStage || "original";

  if (stage === "original") {
    image.dataset.fallbackStage = "category";
    image.src = `/assets/icons/${categoryKey}.svg`;
    return;
  }

  if (stage === "category") {
    image.dataset.fallbackStage = "default";
    image.src = "/assets/icons/default.png";
    return;
  }

  // Even the default icon failed.
  image.onerror = null;
  image.style.display = "none";
}
