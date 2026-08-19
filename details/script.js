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
    updateYear();

    const repoUrl = getRepositoryFromUrl();

    if (!repoUrl) {
      showError("No project URL specified in the query parameters.");
      return;
    }

    // If the input is already "owner/repo" or a full URL
    const repository = parseGitHubRepository(repoUrl) || {
      owner: repoUrl.split("/")[0],
      repo: repoUrl.split("/")[1],
    };

    if (!repository.owner || !repository.repo) {
      showError("Invalid repository format.");
      return;
    }

    try {
      // 1. Fetch Data from GitHub API
      const repoData = await loadRepository(repository);

      // 2. Render GitHub API Data
      renderRepository(repoData);

      // 3. Extract & Append github_data to local project JSON
      const githubData = extractGithubData(repoData, repository);
      findAndSaveGithubData(repository, repoUrl, githubData);

      // 4. Load README & Extract Screenshots
      await loadReadme(repository, repoData.default_branch || "main", repoUrl);

      // 5. Show Content
      hideLoading();
    } catch (err) {
      console.warn("[ProjectDetails] GitHub API failure:", err.message);

      // Fallback: Try loading from localStorage
      const localProject = getStoredProject(repository);

      if (localProject) {
        // If cached github_data exists, use it to populate GitHub render structure
        if (localProject.github_data) {
          renderRepository(localProject.github_data);

          // Render cached screenshots if available
          if (
            Array.isArray(localProject.github_data.screenshot_urls) &&
            localProject.github_data.screenshot_urls.length > 0
          ) {
            renderCachedScreenshots(localProject.github_data.screenshot_urls);
          }
        } else {
          renderLocalProject(localProject, repository);
        }
        hideLoading();
      } else {
        showError(err.message);
      }
    }
  }

  // =========================================================
  // URL & LOCAL STORAGE HELPERS
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

  function getStorageKey(repository) {
    if (!repository?.owner || !repository?.repo) {
      return null;
    }
    return `coderbasket_project_${repository.owner}_${repository.repo}`.toLowerCase();
  }

  function getStoredProject(repository) {
    if (!repository?.owner || !repository?.repo) {
      return null;
    }

    try {
      // First check the expected storage key.
      const storageKey = getStorageKey(repository);

      if (storageKey) {
        const stored = localStorage.getItem(storageKey);

        if (stored) {
          const parsed = JSON.parse(stored);

          if (Array.isArray(parsed)) {
            const match = parsed.find((project) =>
              isMatchingProject(project, repository),
            );

            if (match) {
              return match;
            }
          } else if (
            typeof parsed === "object" &&
            parsed !== null &&
            isMatchingProject(parsed, repository)
          ) {
            return parsed;
          }
        }
      }

      // Then search all localStorage entries.
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (!key || key === storageKey) {
          continue;
        }

        try {
          const raw = localStorage.getItem(key);

          if (!raw) {
            continue;
          }

          const data = JSON.parse(raw);

          if (Array.isArray(data)) {
            const match = data.find((project) =>
              isMatchingProject(project, repository),
            );

            if (match) {
              return match;
            }
          } else if (
            typeof data === "object" &&
            data !== null &&
            isMatchingProject(data, repository)
          ) {
            return data;
          }
        } catch {
          // Ignore unrelated/invalid localStorage entries.
        }
      }

      return null;
    } catch (error) {
      console.warn("[ProjectDetails] Failed reading stored project:", error);

      return null;
    }
  }

  function isMatchingProject(projectObj, repository) {
    if (!projectObj || !repository) {
      return false;
    }

    const projectUrl = projectObj.project_url;

    if (!projectUrl) {
      return false;
    }

    const parsed = parseGitHubRepository(projectUrl);

    if (!parsed) {
      return false;
    }

    return (
      parsed.owner.toLowerCase() === repository.owner.toLowerCase() &&
      parsed.repo.toLowerCase() === repository.repo.toLowerCase()
    );
  }
function extractGithubData(data, repository) {
  if (!data || !repository) {
    return {};
  }

  return {
    stargazers_count: data.stargazers_count ?? null,
    forks_count: data.forks_count ?? null,
    open_issues_count: data.open_issues_count ?? null,
    language: data.language ?? null,

    name: data.name ?? null,
    full_name: data.full_name ?? null,
    description: data.description ?? null,

    html_url:
      data.html_url ||
      `https://github.com/${repository.owner}/${repository.repo}`,

    homepage: data.homepage ?? null,
    default_branch: data.default_branch ?? "main",

    owner: data.owner?.login ?? repository.owner,
    owner_avatar_url: data.owner?.avatar_url ?? null,

    topics: Array.isArray(data.topics)
      ? data.topics
      : [],

    updated_at: data.updated_at ?? null,

    license: data.license?.name ?? null,
  };
}
  function findAndSaveGithubData(repository, repoUrl, githubDataPartial) {
    if (!repository?.owner || !repository?.repo) {
      return false;
    }

    try {
      const storageKey = getStorageKey(repository);

      // Normalize the URL used for matching.
      const parsedRepo = parseGitHubRepository(repoUrl);

      const normalizedRepoUrl = parsedRepo
        ? `https://github.com/${parsedRepo.owner}/${parsedRepo.repo}`
        : repoUrl;

      // =====================================================
      // 1. Check the expected storage key first
      // =====================================================

      if (storageKey) {
        const stored = localStorage.getItem(storageKey);

        if (stored) {
          const data = JSON.parse(stored);

          // Existing JSON is an array of projects.
          if (Array.isArray(data)) {
            const index = data.findIndex(
              (item) =>
                isMatchingProject(item, repository) ||
                item.project_url === repoUrl ||
                item.project_url === normalizedRepoUrl,
            );

            if (index !== -1) {
              data[index].github_data = {
                ...(data[index].github_data || {}),
                ...githubDataPartial,
              };

              // Preserve the existing project_url.
              if (!data[index].project_url) {
                data[index].project_url = normalizedRepoUrl;
              }

              localStorage.setItem(storageKey, JSON.stringify(data));

              console.log(
                "[ProjectDetails] Updated existing project:",
                data[index],
              );

              return true;
            }
          }

          // Existing JSON is a single project.
          if (typeof data === "object" && data !== null) {
            if (
              isMatchingProject(data, repository) ||
              data.project_url === repoUrl ||
              data.project_url === normalizedRepoUrl
            ) {
              data.github_data = {
                ...(data.github_data || {}),
                ...githubDataPartial,
              };

              // Preserve the existing URL.
              if (!data.project_url) {
                data.project_url = normalizedRepoUrl;
              }

              localStorage.setItem(storageKey, JSON.stringify(data));

              console.log("[ProjectDetails] Updated existing project:", data);

              return true;
            }
          }
        }
      }

      // =====================================================
      // 2. Search every localStorage entry
      // =====================================================

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (!key || key === storageKey) {
          continue;
        }

        try {
          const raw = localStorage.getItem(key);

          if (!raw) {
            continue;
          }

          const data = JSON.parse(raw);

          // Existing JSON array.
          if (Array.isArray(data)) {
            const index = data.findIndex(
              (item) =>
                isMatchingProject(item, repository) ||
                item.project_url === repoUrl ||
                item.project_url === normalizedRepoUrl,
            );

            if (index !== -1) {
              data[index].github_data = {
                ...(data[index].github_data || {}),
                ...githubDataPartial,
              };

              if (!data[index].project_url) {
                data[index].project_url = normalizedRepoUrl;
              }

              localStorage.setItem(key, JSON.stringify(data));

              console.log("[ProjectDetails] Updated existing project in:", key);

              return true;
            }
          }

          // Existing single JSON object.
          if (typeof data === "object" && data !== null) {
            if (
              isMatchingProject(data, repository) ||
              data.project_url === repoUrl ||
              data.project_url === normalizedRepoUrl
            ) {
              data.github_data = {
                ...(data.github_data || {}),
                ...githubDataPartial,
              };

              if (!data.project_url) {
                data.project_url = normalizedRepoUrl;
              }

              localStorage.setItem(key, JSON.stringify(data));

              console.log("[ProjectDetails] Updated existing project in:", key);

              return true;
            }
          }
        } catch {
          // Ignore unrelated localStorage entries.
        }
      }

      console.warn(
        "[ProjectDetails] Existing project was not found:",
        normalizedRepoUrl,
      );

      return false;
    } catch (error) {
      console.warn("[ProjectDetails] Failed updating existing project:", error);

      return false;
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
    const url =
      `${GITHUB_API}/repos/` +
      `${encodeURIComponent(repository.owner)}/` +
      `${encodeURIComponent(repository.repo)}`;

    console.log("[GitHub API] Request:", url);

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    // =========================================================
    // GITHUB RATE LIMIT LOG
    // =========================================================

    const limit = response.headers.get("X-RateLimit-Limit");
    const remaining = response.headers.get("X-RateLimit-Remaining");
    const reset = response.headers.get("X-RateLimit-Reset");

    console.log("[GitHub API] Response:", {
      status: response.status,
      limit: limit,
      remaining: remaining,
      reset: reset ? new Date(Number(reset) * 1000).toLocaleString() : null,
    });

    // Warn when getting close to the limit
    if (remaining !== null) {
      const remainingNumber = Number(remaining);

      if (remainingNumber <= 10) {
        console.warn(
          "[GitHub API] ⚠️ Rate limit getting low:",
          remainingNumber,
          "requests remaining",
        );
      }

      if (remainingNumber === 0) {
        console.error("[GitHub API] 🚨 RATE LIMIT REACHED!");
      }
    }

    // =========================================================
    // HANDLE RESPONSE
    // =========================================================

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Repository not found.");
      }

      if (response.status === 403) {
        console.error(
          "[GitHub API] 🚨 403 response. Rate limit may have been reached.",
        );

        throw new Error("GitHub API rate limit reached.");
      }

      throw new Error(`GitHub API returned ${response.status}.`);
    }

    return await response.json();
  }

  // =========================================================
  // RENDER LOCAL PROJECT (CODER BASKET JSON)
  // =========================================================

  function renderLocalProject(projectData, repository) {
    title.textContent =
      projectData.title || repository.repo || "Untitled Project";

    if (author) {
      author.innerHTML = "";

      const avatar = document.createElement("img");
      avatar.src = `https://github.com/${encodeURIComponent(repository.owner)}.png`;
      avatar.alt = "";
      avatar.loading = "lazy";

      const text = document.createElement("span");
      text.textContent = `Created by ${repository.owner}`;

      author.appendChild(avatar);
      author.appendChild(text);
    }

    description.textContent =
      projectData.description || "No description provided.";

    if (projectData.section_category) {
      category.textContent = projectData.section_category;
    } else if (projectData.section) {
      category.textContent = projectData.section;
    } else if (
      projectData.technologies &&
      projectData.technologies.length > 0
    ) {
      category.textContent = projectData.technologies[0];
    } else {
      category.textContent = "Developer Project";
    }

    renderLocalPlatforms(projectData.platforms);
    renderLocalStats(projectData.technologies);
    renderLocalRepositoryCard(projectData, repository);

    if (projectData.external_url) {
      renderHomepage({ homepage: projectData.external_url });
    } else {
      homepageSection.hidden = true;
    }

    if (projectData.youtube_url) {
      renderLocalYoutube(projectData.youtube_url);
    } else {
      youtubeSection.hidden = true;
    }

    if (projectData.image_url) {
      renderLocalImage(projectData.image_url);
    } else {
      screenshotsSection.hidden = true;
    }

    if (readmeSection) {
      readmeSection.hidden = true;
    }

    document.title = `${projectData.title || repository.repo} - Coder Basket`;
  }

  function renderLocalPlatforms(platformsList) {
    platforms.innerHTML = "";

    if (!Array.isArray(platformsList) || platformsList.length === 0) {
      document.getElementById("platformsSection").hidden = true;
      return;
    }

    document.getElementById("platformsSection").hidden = false;

    for (const platform of platformsList) {
      const item = document.createElement("span");
      item.className = "platform-item";
      item.textContent = platform;
      platforms.appendChild(item);
    }
  }

  function renderLocalStats(technologies) {
    stats.innerHTML = "";

    const values = [
      { label: "Stars", value: "—", icon: "★" },
      { label: "Forks", value: "—", icon: "⑂" },
      { label: "Issues", value: "—", icon: "●" },
    ];

    if (Array.isArray(technologies) && technologies.length > 0) {
      values.push({
        label: "Language",
        value: technologies[0],
        icon: "●",
      });
    }

    for (const item of values) {
      const element = document.createElement("div");
      element.className = "project-stat";
      element.innerHTML = `
        <span class="project-stat-icon">${escapeHtml(item.icon)}</span>
        <span class="project-stat-value">${escapeHtml(item.value)}</span>
        <span class="project-stat-label">${escapeHtml(item.label)}</span>
      `;
      stats.appendChild(element);
    }
  }

  function renderLocalRepositoryCard(projectData, repository) {
    repositoryCard.innerHTML = "";

    const card = document.createElement("div");
    card.className = "repository-card-inner";

    const titleElement = document.createElement("h3");
    titleElement.textContent = `${repository.owner}/${repository.repo}`;

    const descriptionElement = document.createElement("p");
    descriptionElement.textContent =
      projectData.description || "No repository description available.";

    const actions = document.createElement("div");
    actions.className = "repository-actions";

    const repoUrl =
      projectData.project_url ||
      `https://github.com/${repository.owner}/${repository.repo}`;

    const source = document.createElement("a");
    source.href = repoUrl;
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.textContent = "Goto Source";

    actions.appendChild(source);

    if (projectData.external_url) {
      const website = document.createElement("a");
      website.href = projectData.external_url;
      website.target = "_blank";
      website.rel = "noopener noreferrer";
      website.textContent = "Website";
      actions.appendChild(website);
    }

    card.appendChild(titleElement);
    card.appendChild(descriptionElement);
    card.appendChild(actions);

    repositoryCard.appendChild(card);
  }

  function renderLocalYoutube(youtubeUrl) {
    const videoId = getYouTubeId(youtubeUrl);

    if (!videoId) {
      youtubeSection.hidden = true;
      return;
    }

    youtubeSection.hidden = false;
    youtube.innerHTML = "";

    const link = document.createElement("a");
    link.href = youtubeUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const image = document.createElement("img");
    image.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    image.alt = "Watch project on YouTube";
    image.loading = "lazy";

    link.appendChild(image);
    youtube.appendChild(link);
  }

  function renderLocalImage(imageUrl) {
    if (!screenshots) {
      return;
    }

    screenshots.innerHTML = "";

    const link = document.createElement("a");
    link.href = imageUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "Project image";
    img.loading = "lazy";

    link.appendChild(img);
    screenshots.appendChild(link);

    screenshotsSection.hidden = false;
  }

  function renderCachedScreenshots(urls) {
    if (!screenshots || !Array.isArray(urls) || urls.length === 0) {
      return;
    }

    screenshots.innerHTML = "";

    for (const src of urls) {
      const link = document.createElement("a");
      link.href = src;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      const screenshot = document.createElement("img");
      screenshot.src = src;
      screenshot.alt = "Project screenshot";
      screenshot.loading = "lazy";

      link.appendChild(screenshot);
      screenshots.appendChild(link);
    }

    screenshotsSection.hidden = false;
  }

  // =========================================================
  // RENDER REPOSITORY (GITHUB API DATA)
  // =========================================================

  function renderRepository(data) {
    title.textContent = data.name || data.full_name || "Untitled Project";

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

    description.textContent =
      data.description || "No description provided by the repository.";

    if (data.topics && data.topics.length > 0) {
      category.textContent = data.topics[0];
    } else if (data.language) {
      category.textContent = data.language;
    } else {
      category.textContent = "Developer Project";
    }

    renderPlatforms(data);
    renderStats(data);
    renderRepositoryCard(data);
    renderHomepage(data);

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
        <span class="project-stat-icon">${escapeHtml(item.icon)}</span>
        <span class="project-stat-value">${escapeHtml(item.value)}</span>
        <span class="project-stat-label">${escapeHtml(item.label)}</span>
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

  async function loadReadme(repository, branch, repoUrl) {
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
      extractScreenshots(html, repository, branch, repoUrl);
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

  function extractScreenshots(html, repository, branch, repoUrl) {
    const template = document.createElement("template");

    template.innerHTML = html;

    const images = [...template.content.querySelectorAll("img")];

    if (images.length === 0) {
      return;
    }

    screenshots.innerHTML = "";
    const collectedUrls = [];

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

      collectedUrls.push(src);

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

    // Save screenshot URLs to localStorage under github_data.screenshot_urls
    if (collectedUrls.length > 0 && repoUrl) {
      findAndSaveGithubData(repository, repoUrl, {
        screenshot_urls: collectedUrls,
      });
    }
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
