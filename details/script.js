/**
 * Coder Basket
 * Dynamic Project Details
 *
 * URL example:
 * /detail/?repo=https://github.com/jsuarezruiz/awesome-dotnet-maui
 */

(() => {
  "use strict";

  // =========================================================
  // CONFIGURATION
  // =========================================================

  const GITHUB_API = "https://api.github.com";

  // =========================================================
  // DOM
  // =========================================================

  const loading = document.getElementById("detailLoading");
  const error = document.getElementById("detailError");
  const project = document.getElementById("projectDetail");

  const title = document.getElementById("projectTitle");
  const author = document.getElementById("projectAuthor");
  const category = document.getElementById("projectCategory");

  const description = document.getElementById("projectDescription");
  const platforms = document.getElementById("projectPlatforms");

  const stats = document.getElementById("projectStats");
  const repositoryCard = document.getElementById("repositoryCard");

  const homepageSection = document.getElementById("homepageSection");
  const homepage = document.getElementById("projectHomepage");

  const youtubeSection = document.getElementById("youtubeSection");
  const youtube = document.getElementById("projectYoutube");

  const screenshotsSection = document.getElementById("screenshotsSection");

  const screenshots = document.getElementById("projectScreenshots");

  const readmeSection = document.getElementById("readmeSection");

  const readme = document.getElementById("projectReadme");

  // =========================================================
  // START
  // =========================================================

  document.addEventListener("DOMContentLoaded", initialize);

  async function initialize() {
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }

    restoreSelection();

    setupNavigation();
    setupSearch();
    setupSorting();

    renderSections();

    await loadCatalog();
  }

  // =========================================================
  // URL
  // =========================================================

  function getRepositoryFromUrl() {
    const params = new URLSearchParams(window.location.search);

    const repo = params.get("repo");

    if (!repo) {
      return null;
    }

    try {
      return decodeURIComponent(repo);
    } catch {
      return repo;
    }
  }

  // =========================================================
  // GITHUB URL PARSER
  // =========================================================

  function parseGitHubRepository(url) {
    try {
      const parsed = new URL(url);

      if (parsed.hostname !== "github.com") {
        return null;
      }

      const parts = parsed.pathname.split("/").filter(Boolean);

      if (parts.length < 2) {
        return null;
      }

      return {
        owner: parts[0],
        repo: parts[1].replace(/\.git$/, ""),
      };
    } catch {
      return null;
    }
  }

  // =========================================================
  // GITHUB API
  // =========================================================

  async function loadRepository(repository) {
    const url = `${GITHUB_API}/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Repository not found.");
      }

      if (response.status === 403) {
        throw new Error("GitHub API rate limit reached.");
      }

      throw new Error(`GitHub API returned ${response.status}.`);
    }

    return await response.json();
  }

  // =========================================================
  // RENDER REPOSITORY
  // =========================================================

  function renderRepository(data) {
    // -----------------------------------------------------
    // TITLE
    // -----------------------------------------------------

    title.textContent = data.name || data.full_name || "Untitled Project";

    // -----------------------------------------------------
    // AUTHOR
    // -----------------------------------------------------

    if (data.owner) {
      author.innerHTML = "";

      const avatar = document.createElement("img");

      avatar.src = data.owner.avatar_url;
      avatar.alt = "";
      avatar.loading = "lazy";

      const text = document.createElement("span");

      text.textContent = `Created by ${data.owner.login}`;

      author.appendChild(avatar);
      author.appendChild(text);
    }

    // -----------------------------------------------------
    // DESCRIPTION
    // -----------------------------------------------------

    description.textContent =
      data.description || "No description provided by the repository.";

    // -----------------------------------------------------
    // CATEGORY
    //
    // The category can later come from codes.json.
    // For now use GitHub topics/language as fallback.
    // -----------------------------------------------------

    if (data.topics && data.topics.length > 0) {
      category.textContent = data.topics[0];
    } else if (data.language) {
      category.textContent = data.language;
    } else {
      category.textContent = "Developer Project";
    }

    // -----------------------------------------------------
    // PLATFORMS
    // -----------------------------------------------------

    renderPlatforms(data);

    // -----------------------------------------------------
    // STATISTICS
    // -----------------------------------------------------

    renderStats(data);

    // -----------------------------------------------------
    // REPOSITORY CARD
    // -----------------------------------------------------

    renderRepositoryCard(data);

    // -----------------------------------------------------
    // HOMEPAGE
    // -----------------------------------------------------

    renderHomepage(data);

    // -----------------------------------------------------
    // PAGE TITLE
    // -----------------------------------------------------

    document.title = `${data.name || "Project"} - Coder Basket`;
  }

  // =========================================================
  // PLATFORMS
  // =========================================================

  function renderPlatforms(data) {
    platforms.innerHTML = "";

    const detected = [];

    const language = (data.language || "").toLowerCase();

    const topics = (data.topics || []).map((x) => x.toLowerCase());

    const combined = `${language} ${topics.join(" ")}`;

    if (combined.includes("android") || combined.includes("android-app")) {
      detected.push("Android");
    }

    if (
      combined.includes("ios") ||
      combined.includes("iphone") ||
      combined.includes("ipad")
    ) {
      detected.push("Apple");
    }

    if (
      combined.includes("windows") ||
      combined.includes("winui") ||
      combined.includes("uwp")
    ) {
      detected.push("Windows");
    }

    if (
      combined.includes("web") ||
      combined.includes("javascript") ||
      combined.includes("typescript")
    ) {
      detected.push("Web");
    }

    if (combined.includes("linux")) {
      detected.push("Linux");
    }

    if (combined.includes("macos") || combined.includes("mac")) {
      detected.push("macOS");
    }

    if (detected.length === 0) {
      document.getElementById("platformsSection").hidden = true;

      return;
    }

    document.getElementById("platformsSection").hidden = false;

    for (const platform of detected) {
      const item = document.createElement("span");

      item.className = "platform-item";

      item.textContent = platform;

      platforms.appendChild(item);
    }
  }

  // =========================================================
  // STATISTICS
  // =========================================================

  function renderStats(data) {
    stats.innerHTML = "";

    const values = [
      {
        label: "Stars",
        value: formatNumber(data.stargazers_count),
        icon: "★",
      },
      {
        label: "Forks",
        value: formatNumber(data.forks_count),
        icon: "⑂",
      },
      {
        label: "Issues",
        value: formatNumber(data.open_issues_count),
        icon: "●",
      },
    ];

    if (data.language) {
      values.push({
        label: "Language",
        value: data.language,
        icon: "●",
      });
    }

    for (const item of values) {
      const element = document.createElement("div");

      element.className = "project-stat";

      element.innerHTML = `
                <span class="project-stat-icon">
                    ${escapeHtml(item.icon)}
                </span>

                <span class="project-stat-value">
                    ${escapeHtml(item.value)}
                </span>

                <span class="project-stat-label">
                    ${escapeHtml(item.label)}
                </span>
            `;

      stats.appendChild(element);
    }
  }

  // =========================================================
  // REPOSITORY CARD
  // =========================================================

  function renderRepositoryCard(data) {
    repositoryCard.innerHTML = "";

    const card = document.createElement("div");

    card.className = "repository-card-inner";

    const titleElement = document.createElement("h3");

    titleElement.textContent = data.full_name;

    const descriptionElement = document.createElement("p");

    descriptionElement.textContent =
      data.description || "No repository description available.";

    const information = document.createElement("div");

    information.className = "repository-information";

    if (data.updated_at) {
      const updated = document.createElement("span");

      updated.textContent = `Updated ${formatDate(data.updated_at)}`;

      information.appendChild(updated);
    }

    if (data.license?.name) {
      const license = document.createElement("span");

      license.textContent = data.license.name;

      information.appendChild(license);
    }

    const actions = document.createElement("div");

    actions.className = "repository-actions";

    const source = document.createElement("a");

    source.href = data.html_url;

    source.target = "_blank";

    source.rel = "noopener noreferrer";

    source.textContent = "Goto Source";

    actions.appendChild(source);

    if (data.homepage) {
      const website = document.createElement("a");

      website.href = data.homepage;

      website.target = "_blank";

      website.rel = "noopener noreferrer";

      website.textContent = "Website";

      actions.appendChild(website);
    }

    card.appendChild(titleElement);
    card.appendChild(descriptionElement);
    card.appendChild(information);
    card.appendChild(actions);

    repositoryCard.appendChild(card);
  }

  // =========================================================
  // HOMEPAGE
  // =========================================================

  function renderHomepage(data) {
    if (!data.homepage) {
      homepageSection.hidden = true;
      return;
    }

    homepageSection.hidden = false;

    homepage.innerHTML = "";

    const link = document.createElement("a");

    link.href = data.homepage;

    link.target = "_blank";

    link.rel = "noopener noreferrer";

    link.textContent = data.homepage;

    homepage.appendChild(link);
  }

  // =========================================================
  // README
  // =========================================================

  async function loadReadme(repository, branch) {
    const url =
      `${GITHUB_API}/repos/` +
      `${encodeURIComponent(repository.owner)}/` +
      `${encodeURIComponent(repository.repo)}/readme`;

    try {
      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, 10000);

      const response = await fetch(url, {
        headers: {
          Accept: "application/vnd.github.html",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`README request failed: ${response.status}`);
        return;
      }

      const html = await response.text();

      if (!html.trim()) {
        console.warn("README response was empty.");
        return;
      }

      readme.innerHTML = sanitizeReadme(html);

      readmeSection.hidden = false;

      extractYouTube(html);
      extractScreenshots(html, repository, branch);
    } catch (err) {
      if (err.name === "AbortError") {
        console.warn("README request timed out.");
      } else {
        console.warn("README could not be loaded:", err);
      }
    }
  }
  // =========================================================
  // README SANITIZATION
  // =========================================================

  function sanitizeReadme(html) {
    const template = document.createElement("template");

    template.innerHTML = html;

    template.content
      .querySelectorAll("script, iframe, object, embed, form")
      .forEach((element) => element.remove());

    template.content.querySelectorAll("img").forEach((image) => {
      const src = image.getAttribute("src") || "";
      const alt = image.getAttribute("alt") || "";

      const value = `${src} ${alt}`.toLowerCase();

      const isBadge =
        value.includes("shields.io") ||
        value.includes("badge") ||
        value.includes("camo.githubusercontent.com") ||
        value.includes("github.com/actions");

      if (isBadge) {
        image.classList.add("readme-badge");
      }

      image.loading = "lazy";
    });

    template.content.querySelectorAll("a").forEach((link) => {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });

    return template.innerHTML;
  }

  // =========================================================
  // YOUTUBE
  // =========================================================

  function extractYouTube(html) {
    const matches = html.match(
      /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/gi,
    );

    if (!matches || matches.length === 0) {
      return;
    }

    const videoUrl = matches[0];

    const videoId = getYouTubeId(videoUrl);

    if (!videoId) {
      return;
    }

    youtubeSection.hidden = false;

    youtube.innerHTML = "";

    const link = document.createElement("a");

    link.href = videoUrl;

    link.target = "_blank";

    link.rel = "noopener noreferrer";

    const image = document.createElement("img");

    image.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    image.alt = "Watch project on YouTube";

    image.loading = "lazy";

    link.appendChild(image);

    youtube.appendChild(link);
  }

  // =========================================================
  // YOUTUBE ID
  // =========================================================

  function getYouTubeId(url) {
    try {
      const parsed = new URL(url);

      if (parsed.hostname.includes("youtu.be")) {
        return parsed.pathname.substring(1).split("/")[0];
      }

      return parsed.searchParams.get("v");
    } catch {
      return null;
    }
  }

  // =========================================================
  // SCREENSHOTS
  // =========================================================

  // =========================================================
  // SCREENSHOTS
  // =========================================================

  function extractScreenshots(html, repository, branch) {
    const template = document.createElement("template");

    template.innerHTML = html;

    const images = [...template.content.querySelectorAll("img")];

    if (images.length === 0) {
      return;
    }

    screenshots.innerHTML = "";

    for (const image of images) {
      const rawSrc = image.getAttribute("src");

      if (!rawSrc) {
        continue;
      }

      const src = resolveReadmeImage(rawSrc, repository, branch);

      if (!src) {
        continue;
      }

      const alt = image.alt || "";
      const lowerSrc = src.toLowerCase();

      // Ignore common README badges/icons.
      if (
        lowerSrc.includes("badge") ||
        lowerSrc.includes("shields.io") ||
        lowerSrc.includes("camo.githubusercontent.com") ||
        lowerSrc.includes("github.com/actions") ||
        lowerSrc.includes("/badge/")
      ) {
        continue;
      }

      const link = document.createElement("a");

      link.href = src;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      const screenshot = document.createElement("img");

      screenshot.src = src;
      screenshot.alt = alt || "Project screenshot";
      screenshot.loading = "lazy";

      link.appendChild(screenshot);

      screenshots.appendChild(link);
    }

    screenshotsSection.hidden = screenshots.children.length === 0;
  }
  // =========================================================
  // HELPERS
  // =========================================================
  function resolveReadmeImage(src, repository, branch) {
    try {
      // Already absolute.
      if (/^https?:\/\//i.test(src)) {
        return src;
      }

      // GitHub repository raw content.
      return `https://raw.githubusercontent.com/${encodeURIComponent(
        repository.owner,
      )}/${encodeURIComponent(repository.repo)}/${encodeURIComponent(
        branch,
      )}/${src.replace(/^\.?\//, "")}`;
    } catch {
      return src;
    }
  }
  function formatNumber(value) {
    const number = Number(value || 0);

    return number.toLocaleString();
  }

  function formatDate(value) {
    try {
      return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return value;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // =========================================================
  // LOADING / ERROR
  // =========================================================

  function hideLoading() {
    loading.hidden = true;

    error.hidden = true;

    project.hidden = false;
  }

  function showError(message) {
    loading.hidden = true;

    project.hidden = true;

    error.hidden = false;

    const paragraph = error.querySelector("p");

    if (paragraph) {
      paragraph.textContent = message;
    }
  }

  // =========================================================
  // YEAR
  // =========================================================

  function updateYear() {
    const year = document.getElementById("year");

    if (year) {
      year.textContent = new Date().getFullYear();
    }
  }
})();
