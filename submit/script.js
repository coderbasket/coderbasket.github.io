const GITHUB_API = "https://api.github.com";

const selectedCategories = new Set();

function renderGrids() {
  renderGridContainer(
    "categoryGrid",
    document.getElementById("categorySearch").value,
  );
  renderGridContainer(
    "modalCategoryGrid",
    document.getElementById("modalCategorySearch").value,
  );
}

function renderGridContainer(containerId, filterText) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  const query = (filterText || "").toLowerCase();

  for (const [id, name] of Object.entries(CATEGORIES)) {
    // Allow filtering by either the category name or its number ID
    const displayText = `${id}. ${name}`;
    if (query && !displayText.toLowerCase().includes(query)) continue;

    const chip = document.createElement("div");
    chip.className = "category-chip";
    if (selectedCategories.has(Number(id))) {
      chip.classList.add("selected");
    }
    chip.textContent = displayText;
    chip.dataset.id = id;

    chip.addEventListener("click", () => {
      const numId = Number(id);
      if (selectedCategories.has(numId)) {
        selectedCategories.delete(numId);
      } else {
        selectedCategories.add(numId);
      }
      updateSelectedCount();
      renderGrids();
    });

    container.appendChild(chip);
  }
}

function filterCategories() {
  renderGridContainer(
    "categoryGrid",
    document.getElementById("categorySearch").value,
  );
}

function filterModalCategories() {
  renderGridContainer(
    "modalCategoryGrid",
    document.getElementById("modalCategorySearch").value,
  );
}

function updateSelectedCount() {
  document.getElementById("selectedCount").textContent =
    `${selectedCategories.size} selected`;
}

function openCategoriesModal() {
  document.getElementById("categoriesModal").style.display = "flex";
  renderGridContainer(
    "modalCategoryGrid",
    document.getElementById("modalCategorySearch").value,
  );
}

function closeCategoriesModal() {
  document.getElementById("categoriesModal").style.display = "none";
  renderGrids();
}

function openResultModal() {
  document.getElementById("resultModal").style.display = "flex";
}

function closeResultModal() {
  document.getElementById("resultModal").style.display = "none";
}

function clearRepoInput() {
  const input = document.getElementById("repoInput");

  input.value = "";
  input.focus();

  updateClearRepoButton();
}

function updateClearRepoButton() {
  const input = document.getElementById("repoInput");
  const clearButton = document.getElementById("clearRepoBtn");

  if (!input || !clearButton) {
    return;
  }

  clearButton.style.display = input.value.trim() !== "" ? "flex" : "none";
}

function cleanGitHubUrl(inputUrl) {
  try {
    const parsed = new URL(inputUrl);
    if (parsed.hostname !== "github.com") return null;
    let cleanPath = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.origin}${cleanPath}`;
  } catch {
    return null;
  }
}

async function processRepository() {
  const rawInput = document.getElementById("repoInput").value.trim();
  const submitterEmail = getSubmitterEmail();
  const loader = document.getElementById("loader");
  const errorMsg = document.getElementById("errorMsg");
  const jsonOutput = document.getElementById("jsonOutput");

  errorMsg.textContent = "";

  if (!rawInput) {
    errorMsg.textContent = "Please enter a valid GitHub repository URL.";
    return;
  }

  const cleanUrl = cleanGitHubUrl(rawInput);

  if (!cleanUrl) {
    errorMsg.textContent = "Invalid GitHub repository URL format.";
    return;
  }

  const repoInfo = parseGitHubRepository(cleanUrl);

  if (!repoInfo) {
    errorMsg.textContent =
      "Could not parse owner and repository name from URL.";
    return;
  }

  loader.style.display = "block";

  try {
    const repoData = await fetchRepoData(repoInfo);
    const branch = repoData.default_branch || "main";

    // Keep this outside the inner try so it can be
    // used by screenshot, category, and section detection.
    let readmeHtml = "";
    let firstScreenshot = null;

    try {
      readmeHtml = await fetchReadmeHtml(repoInfo);

      firstScreenshot = await extractFirstValidScreenshot(
        readmeHtml,
        repoInfo,
        branch,
      );
    } catch (e) {
      console.warn("Could not parse README for screenshots:", e);
    }

    const imageUrl =
      firstScreenshot ||
      `https://opengraph.githubassets.com/1/${repoInfo.owner}/${repoInfo.repo}`;

    const platforms = detectPlatforms(repoData);

    // README is now available here
    const categories = detectCategories(repoData, readmeHtml);

    const section = detectSection(repoData, readmeHtml);

    const generatedJson = {
      project_url: cleanUrl,

      title: repoData.name || "Untitled Project",

      description: repoData.description || "No description provided.",

      // Detection first.
      // GitHub language second.
      // "others" last.
      section:
        section ||
        (repoData.language ? repoData.language.toLowerCase() : "others"),

      section_category:
        repoData.topics && repoData.topics.length > 0
          ? repoData.topics[0]
          : "general",

      technologies: [
        ...(repoData.language ? [repoData.language] : []),

        ...(repoData.topics ? repoData.topics.slice(0, 3) : []),
      ],

      platforms: platforms,

      external_url: repoData.homepage || null,

      youtube_url: null,

      image_url: imageUrl,

      categories: [
        ...new Set([...categories, ...Array.from(selectedCategories)]),
      ],
      submitter_email: submitterEmail || null,
      /*
       * Additional GitHub repository information
       */
      github: {
        stars: repoData.stargazers_count || 0,

        forks: repoData.forks_count || 0,

        watchers: repoData.watchers_count || 0,

        language: repoData.language || null,

        open_issues: repoData.open_issues_count || 0,

        license: repoData.license
          ? repoData.license.spdx_id || repoData.license.name
          : null,

        default_branch: repoData.default_branch || "main",

        archived: repoData.archived || false,

        is_fork: repoData.fork || false,

        topics: repoData.topics || [],

        created_at: repoData.created_at || null,

        updated_at: repoData.updated_at || null,

        pushed_at: repoData.pushed_at || null,
      },
    };

    jsonOutput.textContent = JSON.stringify(generatedJson, null, 2);

    renderProjectPreview(generatedJson);

    openResultModal();
  } catch (err) {
    errorMsg.textContent = err.message;
  } finally {
    loader.style.display = "none";
  }
}

function parseGitHubRepository(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return {
      owner: parts[0],
      repo: parts[1].replace(/\.git$/, ""),
    };
  } catch {
    return null;
  }
}

async function fetchRepoData(repo) {
  const res = await fetch(`${GITHUB_API}/repos/${repo.owner}/${repo.repo}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("Repository not found.");
    if (res.status === 403) throw new Error("GitHub API rate limit reached.");
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return await res.json();
}

async function fetchReadmeHtml(repo) {
  const res = await fetch(
    `${GITHUB_API}/repos/${repo.owner}/${repo.repo}/readme`,
    {
      headers: { Accept: "application/vnd.github.html" },
    },
  );
  if (!res.ok) return "";
  return await res.text();
}

async function extractFirstValidScreenshot(html, repository, branch) {
  const template = document.createElement("template");
  template.innerHTML = html;

  const images = template.content.querySelectorAll("img");

  for (const img of images) {
    const rawSrc = img.getAttribute("src");

    if (!rawSrc) {
      continue;
    }

    let src = rawSrc;

    /*
     * Convert relative README image paths
     * into raw.githubusercontent.com URLs.
     */
    if (!/^https?:\/\//i.test(src)) {
      src =
        `https://raw.githubusercontent.com/` +
        `${repository.owner}/` +
        `${repository.repo}/` +
        `${branch}/` +
        `${src.replace(/^\.?\//, "")}`;
    }

    const lower = src.toLowerCase();

    /*
     * Ignore badges and GitHub-generated assets
     * that are not useful project screenshots.
     */
    const isBadge =
      lower.includes("badge") ||
      lower.includes("shields.io") ||
      lower.includes("camo.githubusercontent.com");

    if (isBadge) {
      continue;
    }

    /*
     * Actually test whether the image can load.
     */
    const valid = await validateImageUrl(src);

    if (valid) {
      return src;
    }

    console.warn("[Screenshot] Invalid image, trying next:", src);
  }

  return null;
}
function validateImageUrl(url) {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      /*
       * Make sure the loaded resource actually
       * has dimensions.
       */
      resolve(image.naturalWidth > 0 && image.naturalHeight > 0);
    };

    image.onerror = () => {
      resolve(false);
    };

    image.src = url;
  });
}
function detectPlatforms(data) {
  const combined =
    `${data.language || ""} ${(data.topics || []).join(" ")}`.toLowerCase();
  const detected = [];

  if (combined.includes("android")) detected.push("android");
  if (
    combined.includes("ios") ||
    combined.includes("iphone") ||
    combined.includes("ipad")
  )
    detected.push("ios");
  if (combined.includes("windows") || combined.includes("winui"))
    detected.push("windows");
  if (
    combined.includes("web") ||
    combined.includes("javascript") ||
    combined.includes("typescript")
  )
    detected.push("web");
  if (combined.includes("linux")) detected.push("linux");
  if (combined.includes("macos")) detected.push("macos");

  return detected.length > 0 ? detected : ["web"];
}

function copyJson() {
  const text = document.getElementById("jsonOutput").textContent;
  navigator.clipboard.writeText(text).then(() => {
    alert("JSON copied to clipboard!");
  });
}

//Preview
// Preview
function renderProjectPreview(data) {
  // ---------------------------------------------------------
  // Basic information
  // ---------------------------------------------------------

  document.getElementById("previewTitle").textContent =
    data.title || "Untitled Project";

  document.getElementById("previewDescription").textContent =
    data.description || "No description provided.";

  // ---------------------------------------------------------
  // Screenshot + Editable Image URL
  // ---------------------------------------------------------

  const image = document.getElementById("previewImage");
  const imageUrlInput = document.getElementById("previewImageUrl");

  const imageUrl = data.image_url || "";

  image.src = imageUrl;

  image.alt = data.title ? `${data.title} screenshot` : "Project screenshot";

  // IMPORTANT:
  // Remember the automatically extracted/generated image.
  // If the user enters an unapproved URL later,
  // this URL will be restored.
  image.dataset.validUrl = imageUrl;

  if (imageUrlInput) {
    imageUrlInput.value = imageUrl;
  }

  // ---------------------------------------------------------
  // Section
  // ---------------------------------------------------------

  document.getElementById("previewSection").textContent = data.section || "—";

  // ---------------------------------------------------------
  // Section Category
  // ---------------------------------------------------------

  const sectionCategoryRow = document.getElementById(
    "previewSectionCategoryRow",
  );

  const sectionCategory = document.getElementById("previewSectionCategory");

  if (data.section_category) {
    sectionCategory.textContent = data.section_category;

    sectionCategoryRow.style.display = "flex";
  } else {
    sectionCategoryRow.style.display = "none";
  }

  // ---------------------------------------------------------
  // Technologies
  // ---------------------------------------------------------

  renderPreviewChips(
    "previewTechnologies",
    "previewTechnologiesRow",
    data.technologies,
  );

  // ---------------------------------------------------------
  // Platforms
  // ---------------------------------------------------------

  renderPreviewChips("previewPlatforms", "previewPlatformsRow", data.platforms);

  // ---------------------------------------------------------
  // Categories
  // ---------------------------------------------------------

  const categoryNames = (data.categories || []).map(
    (id) => CATEGORIES[id] || `Category ${id}`,
  );

  renderPreviewChips(
    "previewCategories",
    "previewCategoriesRow",
    categoryNames,
  );

  // ---------------------------------------------------------
  // GitHub
  // ---------------------------------------------------------

  const github = data.github || {};

  document.getElementById("previewStars").textContent = formatNumber(
    github.stars || 0,
  );

  document.getElementById("previewForks").textContent = formatNumber(
    github.forks || 0,
  );

  const languageStat = document.getElementById("previewLanguageStat");

  if (github.language) {
    document.getElementById("previewLanguage").textContent = github.language;

    languageStat.style.display = "flex";
  } else {
    languageStat.style.display = "none";
  }

  // ---------------------------------------------------------
  // Links
  // ---------------------------------------------------------

  renderPreviewLinks(data);

  // ---------------------------------------------------------
  // Dates
  // ---------------------------------------------------------

  document.getElementById("previewCreatedAt").textContent =
    `Created: ${formatDate(github.created_at)}`;

  document.getElementById("previewUpdatedAt").textContent =
    `Updated: ${formatDate(github.updated_at)}`;

  document.getElementById("previewGithubUpdatedAt").textContent =
    `GitHub Updated: ${formatDate(github.updated_at)}`;
}
function setupImageUrlEditor() {
  const input = document.getElementById("previewImageUrl");
  const image = document.getElementById("previewImage");

  if (!input || !image) return;

  input.addEventListener("change", async () => {
    const url = input.value.trim();

    if (!url) {
      input.value = image.dataset.validUrl || "";
      return;
    }

    const valid = await validateUserImageUrl(url);

    if (!valid) {
      alert("Image URL is not from an approved image source.");

      // Restore the last valid/extracted image
      const previousUrl = image.dataset.validUrl || "";

      input.value = previousUrl;
      image.src = previousUrl;

      return;
    }

    // New URL is valid
    image.src = url;
    image.dataset.validUrl = url;

    updateGeneratedImageUrl(url);
  });

  image.addEventListener("error", () => {
    image.classList.add("image-load-error");
  });

  image.addEventListener("load", () => {
    image.classList.remove("image-load-error");
  });
}
function updateGeneratedImageUrl(url) {
  const jsonOutput = document.getElementById("jsonOutput");

  if (!jsonOutput.textContent) return;

  try {
    const data = JSON.parse(jsonOutput.textContent);

    data.image_url = url || null;

    jsonOutput.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    console.warn("Could not update image_url in generated JSON:", error);
  }
}

function renderPreviewChips(containerId, rowId, values) {
  const container = document.getElementById(containerId);

  const row = document.getElementById(rowId);

  container.innerHTML = "";

  if (!Array.isArray(values) || values.length === 0) {
    row.style.display = "none";

    return;
  }

  row.style.display = "flex";

  values.forEach((value) => {
    const chip = document.createElement("span");

    chip.className = "preview-chip";

    chip.textContent = value;

    container.appendChild(chip);
  });
}

function renderPreviewLinks(data) {
  const container = document.getElementById("previewLinks");

  container.innerHTML = "";

  if (data.project_url) {
    const githubLink = document.createElement("a");

    githubLink.href = data.project_url;

    githubLink.target = "_blank";

    githubLink.rel = "noopener noreferrer";

    githubLink.textContent = "GitHub Repository";

    container.appendChild(githubLink);
  }

  if (data.external_url) {
    const websiteLink = document.createElement("a");

    websiteLink.href = data.external_url;

    websiteLink.target = "_blank";

    websiteLink.rel = "noopener noreferrer";

    websiteLink.textContent = "Website";

    container.appendChild(websiteLink);
  }

  if (data.youtube_url) {
    const youtubeLink = document.createElement("a");

    youtubeLink.href = data.youtube_url;

    youtubeLink.target = "_blank";

    youtubeLink.rel = "noopener noreferrer";

    youtubeLink.textContent = "YouTube";

    container.appendChild(youtubeLink);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString();
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

//Categories
function detectCategories(repoData, readmeText = "") {
  const text = [
    repoData.name || "",
    repoData.description || "",
    ...(repoData.topics || []),
    repoData.language || "",
    readmeText || "",
  ]
    .join(" ")
    .toLowerCase();

  const scores = new Map();

  function addScore(categoryId, score = 1) {
    scores.set(categoryId, (scores.get(categoryId) || 0) + score);
  }

  // =========================================================
  // AI / MACHINE LEARNING
  // =========================================================

  if (
    /\bai agent\b|\bai-agent\b|\bagentic\b|\bagents\b|\bautonomous agent\b|\bmulti-agent\b/.test(
      text,
    )
  ) {
    addScore(48, 5); // AI Agents
  }

  if (
    /\bllm\b|\blarge language model\b|\blanguage model\b|\bfoundation model\b/.test(
      text,
    )
  ) {
    addScore(47, 4); // LLM
  }

  if (
    /\brag\b|\bretrieval augmented generation\b|\bvector search\b/.test(text)
  ) {
    addScore(49, 5); // RAG
  }

  if (/\bmachine learning\b|\bml\b|\bscikit-learn\b|\bsklearn\b/.test(text)) {
    addScore(66, 4); // Machine Learning
  }

  if (
    /\bdeep learning\b|\bneural network\b|\bpytorch\b|\btensorflow\b/.test(text)
  ) {
    addScore(67, 4); // Deep Learning
  }

  // =========================================================
  // AI DEVELOPMENT
  // =========================================================

  if (
    /\bcoding assistant\b|\bai coding\b|\bai programmer\b|\bcode assistant\b|\bprogramming assistant\b|\bsoftware engineer\b/.test(
      text,
    )
  ) {
    addScore(57, 5); // AI Coding
  }

  if (/\bai search\b|\bsemantic search\b|\bintelligent search\b/.test(text)) {
    addScore(58, 4); // AI Search
  }

  if (
    /\bai image\b|\bimage generation\b|\bstable diffusion\b|\bdiffusion model\b/.test(
      text,
    )
  ) {
    addScore(59, 5); // AI Image Generation
  }

  if (/\bai video\b|\bvideo generation\b|\btext-to-video\b/.test(text)) {
    addScore(60, 5); // AI Video Generation
  }

  if (
    /\bai assistant\b|\bvirtual assistant\b|\bpersonal assistant\b/.test(text)
  ) {
    addScore(54, 4); // AI Assistants
  }

  if (
    /\bai automation\b|\bautomated workflow\b|\bworkflow automation\b/.test(
      text,
    )
  ) {
    addScore(55, 4); // AI Automation
  }

  if (/\bgenerative ai\b|\bgenerative-ai\b|\bgenai\b/.test(text)) {
    addScore(53, 4); // Generative AI
  }

  // =========================================================
  // DEVELOPER TOOLS
  // =========================================================

  if (
    /\bdeveloper tool\b|\bdeveloper tools\b|\bdevtool\b|\bdevelopment tool\b/.test(
      text,
    )
  ) {
    addScore(76, 4); // Developer Tools
  }

  if (
    /\bcode editor\b|\beditor\b|\bide\b|\bdevelopment environment\b/.test(text)
  ) {
    addScore(78, 3); // Code Editor
    addScore(77, 3); // Development Environment
  }

  if (/\bdebug\b|\bdebugger\b|\bdebugging\b/.test(text)) {
    addScore(79, 4); // Debugging
  }

  if (/\btest\b|\btesting\b|\bunit test\b|\bintegration test\b/.test(text)) {
    addScore(80, 3); // Testing
  }

  if (/\bcli\b|\bcommand line\b|\bterminal\b|\bshell\b/.test(text)) {
    addScore(85, 4); // CLI
    addScore(86, 3); // Command Line
  }

  // =========================================================
  // WEB DEVELOPMENT
  // =========================================================

  if (
    /\bjavascript\b|\btypescript\b|\breact\b|\bvue\b|\bangular\b/.test(text)
  ) {
    addScore(91, 3); // Web Development
  }

  if (/\bjavascript\b/.test(text)) {
    addScore(92, 4);
  }

  if (/\btypescript\b/.test(text)) {
    addScore(93, 4);
  }

  if (/\bhtml\b|\bhtml5\b/.test(text)) {
    addScore(94, 3);
  }

  if (/\bcss\b|\bscss\b|\bsass\b/.test(text)) {
    addScore(95, 3);
  }

  // =========================================================
  // API / BACKEND
  // =========================================================

  if (/\bapi\b|\bapi server\b|\bapi client\b|\bweb api\b/.test(text)) {
    addScore(82, 3); // API
  }

  if (/\brest api\b|\brestful\b/.test(text)) {
    addScore(83, 4);
  }

  if (/\bgraphql\b/.test(text)) {
    addScore(84, 4);
  }

  // =========================================================
  // DATABASES
  // =========================================================

  if (/\bdatabase\b|\bsql\b|\bordm\b/.test(text)) {
    addScore(102, 2);
  }

  if (/\bsqlite\b/.test(text)) {
    addScore(103, 5);
  }

  if (/\bpostgresql\b|\bpostgres\b/.test(text)) {
    addScore(104, 5);
  }

  if (/\bmysql\b/.test(text)) {
    addScore(105, 5);
  }

  if (/\bnosql\b|\bmongodb\b|\bcouchdb\b/.test(text)) {
    addScore(106, 5);
  }

  // =========================================================
  // CLOUD / DEVOPS
  // =========================================================

  if (/\bcloud\b|\bcloud computing\b|\baws\b|\bazure\b|\bgcp\b/.test(text)) {
    addScore(111, 3);
    addScore(112, 4);
  }

  if (/\bdocker\b|\bcontainer\b|\bcontainers\b/.test(text)) {
    addScore(115, 4);
    addScore(116, 5);
  }

  if (/\bkubernetes\b|\bk8s\b/.test(text)) {
    addScore(117, 5);
  }

  if (
    /\bdevops\b|\bcontinuous integration\b|\bcontinuous deployment\b/.test(text)
  ) {
    addScore(118, 4);
  }

  if (/\bci\/cd\b|\bgithub actions\b|\bgitlab ci\b/.test(text)) {
    addScore(119, 5);
  }

  // =========================================================
  // DOCUMENTATION / EDUCATION
  // =========================================================

  if (/\bdocumentation\b|\bdocs\b|\bdeveloper documentation\b/.test(text)) {
    addScore(158, 3);
  }

  if (/\btutorial\b|\btutorials\b|\bguide\b|\blearning\b/.test(text)) {
    addScore(159, 3);
    addScore(157, 2);
  }

  // =========================================================
  // FRAMEWORK / LIBRARY
  // =========================================================

  if (/\bframework\b|\bframeworks\b/.test(text)) {
    addScore(170, 4);
  }

  if (/\blibrary\b|\bsdk\b|\bpackage\b|\bmodule\b/.test(text)) {
    addScore(171, 3);
    addScore(46, 2);
  }

  // =========================================================
  // OPEN SOURCE
  // =========================================================

  if (/\bopen source\b|\bopen-source\b/.test(text)) {
    addScore(184, 3);
  }

  // =========================================================
  // SORT + LIMIT
  // =========================================================

  return [...scores.entries()]
    .filter(([id, score]) => score >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id);
}

const SECTION_DETECTION_RULES = {
  ai: {
    keywords: [
      "artificial intelligence",
      "machine learning",
      "deep learning",
      "llm",
      "genai",
      "generative ai",
      "ai agent",
      "ai-agent",
      "ai assistant",
      "ai coding",
      "computer vision",
      "natural language processing",
      "nlp",
      "neural network",
      "transformer",
    ],
  },

  dotnet: {
    keywords: [
      ".net",
      "dotnet",
      "c#",
      "csharp",
      "asp.net",
      "blazor",
      "winui",
      "wpf",
      "uwp",
      ".net maui",
      "maui",
    ],
  },

  flutter: {
    keywords: [
      "flutter",
      "dart",
      "flutter sdk",
      "flutter app",
      "flutter package",
    ],
  },

  // Virtual framework sections
  kotlin: {
    keywords: ["kotlin"],
  },

  react: {
    keywords: ["react", "reactjs", "react.js"],
  },

  "react-native": {
    keywords: ["react native", "react-native"],
  },

  vue: {
    keywords: ["vue", "vuejs", "vue.js"],
  },

  angular: {
    keywords: ["angular", "angularjs"],
  },

  svelte: {
    keywords: ["svelte", "sveltekit"],
  },

  nextjs: {
    keywords: ["next.js", "nextjs"],
  },

  nuxt: {
    keywords: ["nuxt", "nuxtjs", "nuxt.js"],
  },

  electron: {
    keywords: ["electron", "electronjs"],
  },

  tauri: {
    keywords: ["tauri"],
  },

  "kotlin-multiplatform": {
    keywords: ["kotlin multiplatform", "kmp"],
  },

  laravel: {
    keywords: ["laravel"],
  },

  django: {
    keywords: ["django"],
  },

  spring: {
    keywords: ["spring boot", "spring framework"],
  },

  "ruby-on-rails": {
    keywords: ["ruby on rails", "rails"],
  },
};
function detectSection(repoData, readmeText = "") {
  const text = [
    repoData.name || "",
    repoData.description || "",
    repoData.language || "",
    ...(repoData.topics || []),
    readmeText || "",
  ]
    .join(" ")
    .toLowerCase();

  const scores = new Map();

  for (const [section, config] of Object.entries(SECTION_DETECTION_RULES)) {
    // Make sure this is actually a valid section
    // or a valid virtual framework.
    const isDataSection = Object.prototype.hasOwnProperty.call(
      DATA_SECTIONS,
      section,
    );

    const isFramework = Object.prototype.hasOwnProperty.call(
      FRAMEWORKS,
      section,
    );

    if (!isDataSection && !isFramework) {
      continue;
    }

    let score = 0;

    for (const keyword of config.keywords) {
      const normalizedKeyword = keyword.toLowerCase();

      if (text.includes(normalizedKeyword)) {
        // Exact repository topic/name matches are stronger.
        if (
          (repoData.topics || []).some(
            (topic) => topic.toLowerCase() === normalizedKeyword,
          )
        ) {
          score += 5;
        } else if (
          (repoData.name || "").toLowerCase().includes(normalizedKeyword)
        ) {
          score += 4;
        } else if (
          (repoData.description || "").toLowerCase().includes(normalizedKeyword)
        ) {
          score += 3;
        } else {
          score += 1;
        }
      }
    }

    if (score > 0) {
      scores.set(section, score);
    }
  }

  if (scores.size === 0) {
    return "";
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);

  return ranked[0][0];
}

//#region appscript
async function validateAndSubmitJson() {
  const jsonOutput = document.getElementById("jsonOutput");

  if (!jsonOutput) {
    alert("JSON output element was not found.");
    return;
  }

  let data;

  try {
    data = JSON.parse(jsonOutput.textContent);
  } catch (error) {
    alert("The generated JSON is invalid and cannot be submitted.");
    console.error("JSON parse error:", error);
    return;
  }

  const errors = validateGeneratedJson(data);

  if (errors.length > 0) {
    alert(
      "JSON validation failed:\n\n" +
        errors.map((error) => `• ${error}`).join("\n"),
    );

    console.error("JSON validation errors:", errors);

    return;
  }

  // JSON is valid here.
  console.log("JSON validation successful:", data);

  await submitToAppsScript(data);
}
async function submitToAppsScript(data) {
  const submitButton = document.querySelector("#resultModal .submit-btn");

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";
  }

  try {
    const requestBody = {
      // Sheet name comes from the detected section
      sheet: data.section,
      email: submitterEmail,
      data: data,
    };

    console.log("Submitting to Apps Script:", requestBody);

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",

      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },

      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();

    console.log("Apps Script HTTP status:", response.status);
    console.log("Apps Script raw response:", responseText);

    if (!response.ok) {
      throw new Error(
        `Apps Script returned HTTP ${response.status}: ${responseText}`,
      );
    }

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(`Apps Script returned invalid JSON: ${responseText}`);
    }

    console.log("Apps Script parsed response:", result);

    if (!result.success) {
      throw new Error(
        result.error ||
          result.message ||
          "Apps Script rejected the submission.",
      );
    }
    // Initialize SQLite before saving locally.
    await CoderBasketDB.init();
    await CoderBasketDB.save(data);
    alert(
      `Project submitted successfully!\n\n` +
        `Section: ${data.section}\n` +
        `Sheet: ${result.sheet || data.section}\n` +
        `ID: ${result.id || "—"}`,
    );
  } catch (error) {
    console.error("Submission failed:", error);

    alert(`Submission failed:\n\n${error.message}`);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Submit";
    }
  }
}
//#endregion

const SAFE_IMAGE_HOSTS = [
  // GitHub
  "github.com",
  "githubusercontent.com",
  "user-images.githubusercontent.com",
  "raw.githubusercontent.com",
  "camo.githubusercontent.com",
  "avatars.githubusercontent.com",
  "opengraph.githubassets.com",

  // GitHub / developer CDNs
  "cdn.jsdelivr.net",
  "fastly.jsdelivr.net",

  // Cloud / object storage
  "amazonaws.com",
  "cloudfront.net",
  "storage.googleapis.com",
  "googleusercontent.com",
  "azureedge.net",
  "blob.core.windows.net",

  // Microsoft / developer ecosystem
  "microsoft.com",
  "devblogs.microsoft.com",
  "visualstudiomagazine.com",
  "visualstudio.com",
  "learn.microsoft.com",
  "azure.microsoft.com",
  "dotnet.microsoft.com",

  // Developer websites / publications
  "medium.com",
  "miro.medium.com",
  "dev.to",
  "telerik.com",
  "stackoverflow.com",
  "stack.imgur.com",

  // Image / media CDNs
  "cloudinary.com",
  "imgix.net",
  "imagekit.io",

  // Social / app screenshots
  "play-lh.googleusercontent.com",
  "pbs.twimg.com",

  // Existing project asset host
  "uno-website-assets",
];
async function validateUserImageUrl(url) {
  if (!isSafeUserImageUrl(url)) {
    return false;
  }

  return await new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      resolve(image.naturalWidth > 0 && image.naturalHeight > 0);
    };

    image.onerror = () => {
      resolve(false);
    };

    image.src = url;
  });
}
function isSafeUserImageUrl(url) {
  try {
    const parsed = new URL(url);

    // HTTPS only
    if (parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    return SAFE_IMAGE_HOSTS.some((allowed) => {
      const domain = allowed.toLowerCase();

      // Exact domain
      if (hostname === domain) {
        return true;
      }

      // Subdomains
      return hostname.endsWith("." + domain);
    });
  } catch {
    return false;
  }
}

//#region
const SUBMITTER_EMAIL_KEY = "coderBasketSubmitterEmail";

function setupSubmitterEmail() {
  const emailInput = document.getElementById("submitterEmail");

  if (!emailInput) return;

  // Restore previously entered email
  const savedEmail = localStorage.getItem(SUBMITTER_EMAIL_KEY);

  if (savedEmail) {
    emailInput.value = savedEmail;
  }

  // Save whenever the user changes it
  emailInput.addEventListener("input", () => {
    const email = emailInput.value.trim();

    if (email) {
      localStorage.setItem(SUBMITTER_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(SUBMITTER_EMAIL_KEY);
    }

    updateClearEmailButton();
  });

  updateClearEmailButton();
}

function clearEmailInput() {
  const input = document.getElementById("submitterEmail");

  if (!input) return;

  input.value = "";
  localStorage.removeItem(SUBMITTER_EMAIL_KEY);

  input.focus();

  updateClearEmailButton();
}

function updateClearEmailButton() {
  const input = document.getElementById("submitterEmail");
  const button = document.getElementById("clearEmailBtn");

  if (!input || !button) return;

  button.style.display = input.value.trim() !== "" ? "flex" : "none";
}
function getSubmitterEmail() {
  const input = document.getElementById("submitterEmail");

  if (!input) {
    return "";
  }

  return input.value.trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
//#endregion

document.addEventListener("DOMContentLoaded", () => {
  renderGrids();
  setupImageUrlEditor();

  const repoInput = document.getElementById("repoInput");

  if (repoInput) {
    repoInput.addEventListener("input", updateClearRepoButton);
    updateClearRepoButton();
  }
  setupSubmitterEmail();
  console.log("[Submit] DOMContentLoaded");

  // Start SQLite initialization in the background.
  // The page does NOT wait for this.
  CoderBasketDB.init()
    .then(() => {
      console.log("[Submit] SQLite initialized successfully.");
    })
    .catch((error) => {
      console.error("[Submit] SQLite initialization failed:", error);
    });

  // Continue the rest of your page initialization immediately.
});
