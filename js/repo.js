"use strict";

// =========================================================
// GitHub Stats
// =========================================================
//
// GitHub information comes directly from project.github.
//
// No GitHub API request.
// No localStorage lookup.
// No detail.js dependency.
//
// =========================================================

function loadGitHubStats(card, repo, githubData = null) {
  const statsElement = card?.querySelector("[data-stats]");

  if (!statsElement || !repo) {
    return;
  }

  const normalizedRepo = normalizeRepository(repo);

  if (!normalizedRepo) {
    statsElement.innerHTML = "";
    return;
  }

  renderGitHubStats(
    statsElement,
    githubData,
    normalizedRepo
  );
}

// =========================================================
// Normalize Repository
// =========================================================

function normalizeRepository(repo) {
  if (!repo) {
    return null;
  }

  let value = String(repo).trim();

  value = value
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/^github\.com\//i, "")
    .replace(/\/+$/, "");

  const parts = value.split("/").filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  const owner = parts[0];
  const repository = parts[1].replace(/\.git$/i, "");

  if (!owner || !repository) {
    return null;
  }

  return `${owner}/${repository}`;
}

// =========================================================
// Render
// =========================================================

function renderGitHubStats(statsElement, stats, repo) {
  if (!statsElement || !repo) {
    return;
  }

  const normalizedRepo = normalizeRepository(repo);

  if (!normalizedRepo) {
    statsElement.innerHTML = "";
    return;
  }

  const githubUrl =
    `https://github.com/${normalizedRepo}`;

  const stars =
    stats && stats.stars != null
      ? `<span>★ ${formatNumber(stats.stars)}</span>`
      : "";

  const forks =
    stats && stats.forks != null
      ? `<span>⑂ ${formatNumber(stats.forks)}</span>`
      : "";

  const language =
    stats && stats.language
      ? `<span>${escapeHtml(stats.language)}</span>`
      : "";

  statsElement.innerHTML = `
    ${stars}
    ${forks}
    ${language}

    <a
      class="github-stats-link"
      href="${escapeAttribute(githubUrl)}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open GitHub repository"
      title="Open GitHub repository"
    >
      <svg
        class="github-stats-icon"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill="currentColor"
          d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55v-2.13c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.67 1.24 3.32.95.1-.74.4-1.24.72-1.53-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.77.11 3.06.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.77 1.08.77 2.18v3.23c0 .3.21.65.8.54A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
        />
      </svg>
    </a>
  `;
}

// =========================================================
// Number Formatting
// =========================================================

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

// =========================================================
// HTML Encoding
// =========================================================

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

// =========================================================
// Extract GitHub Repository
// =========================================================

function getGitHubRepo(url) {
  return normalizeRepository(url);
}