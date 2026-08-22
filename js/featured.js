
"use strict";

/* =========================================================
   FEATURED PROJECTS
   ---------------------------------------------------------
   - Loads featured.css automatically
   - Fetches submitted projects from Apps Script
   - Caches response for 1 hour using Cache API
   - Does not use localStorage
   - Does not block the main catalogue
   - Falls back to stale cache if network fails
   ========================================================= */

(() => {
  /* =======================================================
     CONFIGURATION
     ======================================================= */

  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbywPDM_egWmshTchU72gBmC8e38MSgD0A0PhAgBz6x8qnezZq6ABrSTeB8VCbk0ayXv/exec";

  const CSS_URL = "/css/featured.css";

  const FEATURED_LIMIT = 6;

  const REQUEST_TIMEOUT = 8000;

  /*
   * Featured data cache.
   */
  const CACHE_NAME = "featured-projects-v1";

  /*
   * Cache lifetime:
   *
   * 1 hour = 60 minutes
   */
  const CACHE_DURATION = 60 * 60 * 1000;


  /* =======================================================
     INITIALIZATION
     ======================================================= */

  function initializeFeatured() {
    loadFeaturedCss();

    /*
     * Do not wait for featured projects.
     */
    loadFeaturedProjects();
  }


  /* =======================================================
     LOAD CSS
     ======================================================= */

  function loadFeaturedCss() {
    if (document.querySelector(`link[data-featured-css="true"]`)) {
      return;
    }

    const existingLink = Array.from(
      document.querySelectorAll('link[rel="stylesheet"]'),
    ).find((link) => {
      return link.href === new URL(CSS_URL, location.href).href;
    });

    if (existingLink) {
      return;
    }

    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = CSS_URL;
    link.dataset.featuredCss = "true";

    document.head.appendChild(link);
  }


  /* =======================================================
     LOAD FEATURED PROJECTS
     ======================================================= */

  async function loadFeaturedProjects() {
    try {
      console.log("[Featured] Loading submitted projects...");

      /*
       * Try cached data first.
       */
      const cached = await getCachedProjects();

      if (cached && !cached.expired) {
        console.log("[Featured] Using cached projects.");

        renderFeaturedProjects(cached.projects);

        return;
      }

      /*
       * Cache is expired or unavailable.
       *
       * Fetch fresh data.
       */
      console.log("[Featured] Cache expired. Fetching fresh data...");

      try {
        const projects = await fetchFeaturedProjects();

        if (projects.length) {
          await saveCachedProjects(projects);

          renderFeaturedProjects(projects);

          console.log("[Featured] Fresh projects loaded.");

          return;
        }

        /*
         * Apps Script returned no projects.
         */
        console.log("[Featured] No submitted projects found.");

        /*
         * If stale cache exists, use it as fallback.
         */
        if (cached?.projects?.length) {
          console.log("[Featured] Using stale cached projects.");

          renderFeaturedProjects(cached.projects);
        }
      } catch (fetchError) {
        /*
         * Network failed.
         *
         * Use stale cache if available.
         */
        console.warn(
          "[Featured] Fresh fetch failed:",
          fetchError,
        );

        if (cached?.projects?.length) {
          console.log("[Featured] Using stale cached projects.");

          renderFeaturedProjects(cached.projects);
        }
      }
    } catch (error) {
      /*
       * Featured is optional.
       *
       * Never break the main catalogue.
       */
      console.warn(
        "[Featured] Unable to load submitted projects:",
        error,
      );
    }
  }


  /* =======================================================
     FETCH FROM APPS SCRIPT
     ======================================================= */

  async function fetchFeaturedProjects() {
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT);

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "GET",

        /*
         * We control caching ourselves through
         * the Cache API.
         */
        cache: "no-store",

        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      console.log("[Featured] Apps Script response:", data);

      return normalizeProjectsResponse(data);
    } finally {
      clearTimeout(timeoutId);
    }
  }


  /* =======================================================
     CACHE API
     ======================================================= */

  async function getCachedProjects() {
    if (!("caches" in window)) {
      return null;
    }

    try {
      const cache = await caches.open(CACHE_NAME);

      const request = new Request(APPS_SCRIPT_URL);

      const response = await cache.match(request);

      if (!response) {
        return null;
      }

      const timestamp = response.headers.get("X-Featured-Cached-At");

      if (!timestamp) {
        return null;
      }

      const cachedAt = Number(timestamp);

      if (!Number.isFinite(cachedAt)) {
        return null;
      }

      const age = Date.now() - cachedAt;

      const data = await response.json();

      const projects = normalizeProjectsResponse(data);

      return {
        projects,
        expired: age >= CACHE_DURATION,
      };
    } catch (error) {
      console.warn(
        "[Featured] Unable to read cache:",
        error,
      );

      return null;
    }
  }


  async function saveCachedProjects(projects) {
    if (!("caches" in window)) {
      return;
    }

    try {
      const cache = await caches.open(CACHE_NAME);

      const response = new Response(
        JSON.stringify(projects),
        {
          headers: {
            "Content-Type": "application/json",
            "X-Featured-Cached-At": String(Date.now()),
          },
        },
      );

      await cache.put(
        new Request(APPS_SCRIPT_URL),
        response,
      );

      console.log("[Featured] Projects cached for 1 hour.");
    } catch (error) {
      console.warn(
        "[Featured] Unable to save cache:",
        error,
      );
    }
  }


  /* =======================================================
     NORMALIZE APPS SCRIPT RESPONSE
     ======================================================= */

  function normalizeProjectsResponse(data) {
    let projects = [];

    if (Array.isArray(data)) {
      projects = data;
    } else if (Array.isArray(data.projects)) {
      projects = data.projects;
    } else if (Array.isArray(data.data)) {
      projects = data.data;
    } else if (Array.isArray(data.items)) {
      projects = data.items;
    }

    return projects
      .map(normalizeProject)
      .filter(Boolean);
  }


  /* =======================================================
     NORMALIZE PROJECT
     ======================================================= */

  function normalizeProject(project) {
    if (!project || typeof project !== "object") {
      return null;
    }

    const title =
      project.title ??
      project.Title ??
      project.name ??
      project.Name ??
      "";

    const description =
      project.description ??
      project.Description ??
      project.desc ??
      "";

    const projectUrl =
      project.project_url ??
      project.projectUrl ??
      project.ProjectUrl ??
      project.url ??
      project.URL ??
      project.github_url ??
      project.githubUrl ??
      "";

    const image =
      project.image ??
      project.image_url ??
      project.imageUrl ??
      project.thumbnail ??
      project.logo ??
      "";

    const category =
      project.category ??
      project.Category ??
      "";

    const submittedAt =
      project.created_at ??
      project.createdAt ??
      project.submitted_at ??
      project.submittedAt ??
      project.timestamp ??
      project.Timestamp ??
      "";

    if (!title || !projectUrl) {
      return null;
    }

    return {
      ...project,

      title: String(title).trim(),

      description: String(description).trim(),

      project_url: String(projectUrl).trim(),

      image: String(image).trim(),

      category: String(category).trim(),

      submitted_at: String(submittedAt).trim(),
    };
  }


  /* =======================================================
     RENDER FEATURED SECTION
     ======================================================= */

  function renderFeaturedProjects(projects) {
    const featuredProjects =
      projects.slice(0, FEATURED_LIMIT);

    if (!featuredProjects.length) {
      return;
    }

    /*
     * Prevent duplicate rendering.
     */
    const existingSection =
      document.querySelector("#featuredProjects");

    if (existingSection) {
      existingSection.remove();
    }

    const section = document.createElement("section");

    section.id = "featuredProjects";
    section.className = "featured-projects-section";

    section.innerHTML = `
      <div class="container">

        <div class="featured-layout">

          <div class="featured-sidebar-space"></div>

          <div class="featured-content">

            <div class="featured-header">

              <div>
                <span class="featured-label">
                  ★ Featured
                </span>

                <h2>
                  New Submitted Projects
                </h2>
              </div>

              <a
                href="/featured/"
                class="featured-view-all"
              >
                View all →
              </a>

            </div>

            <div class="featured-project-grid">
              ${featuredProjects
                .map(renderProjectCard)
                .join("")}
            </div>

          </div>

        </div>

      </div>
    `;

    const hero = document.querySelector(".hero");

    if (hero) {
      hero.insertAdjacentElement(
        "afterend",
        section,
      );

      console.log(
        "[Featured] Inserted below hero.",
      );
    } else {
      console.warn(
        "[Featured] Hero section not found.",
      );
    }

    console.log(
      "[Featured] Rendered:",
      featuredProjects.length,
      "projects",
    );
  }


  /* =======================================================
     PROJECT CARD
     ======================================================= */

  function renderProjectCard(project) {
    const title = escapeHtml(project.title);

    const description = escapeHtml(
      project.description ||
        "Newly submitted developer project.",
    );

    const url = escapeAttribute(
      project.project_url,
    );

    const category = project.category
      ? escapeHtml(project.category)
      : "";

    const imageHtml =
      renderProjectImage(project);

    return `
      <article
        class="featured-project-card"
      >

        <div class="featured-card-top">

          ${imageHtml}

          <div class="featured-card-badge">
            NEW
          </div>

        </div>

        <div class="featured-card-body">

          <h3>
            <a
              href="${url}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${title}
            </a>
          </h3>

          <p class="featured-description">
            ${description}
          </p>

          ${
            category
              ? `
                <span class="featured-category">
                  ${category}
                </span>
              `
              : ""
          }

        </div>

        <div class="featured-card-footer">

          <a
            href="${url}"
            target="_blank"
            rel="noopener noreferrer"
            class="featured-github-link"
          >
            GitHub ↗
          </a>

        </div>

      </article>
    `;
  }


  /* =======================================================
     PROJECT IMAGE
     ======================================================= */

  function renderProjectImage(project) {
    if (!project.image) {
      return `
        <div
          class="featured-project-placeholder"
          aria-hidden="true"
        >
          &lt;/&gt;
        </div>
      `;
    }

    return `
      <img
        class="featured-project-image"
        src="${escapeAttribute(project.image)}"
        alt=""
        loading="lazy"
        onerror="this.style.display='none';"
      >
    `;
  }


  /* =======================================================
     HTML ESCAPING
     ======================================================= */

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


  /* =======================================================
     START
     ======================================================= */

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeFeatured,
      {
        once: true,
      },
    );
  } else {
    initializeFeatured();
  }
})();

