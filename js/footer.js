"use strict";

/* =======================================================
   Dynamic Footer
======================================================= */

function initializeFooter() {
  if (typeof SITE_CONFIG === "undefined") {
    console.error("SITE_CONFIG is not available.");
    return;
  }
// Load footer.css
  if (!document.querySelector('link[href="/css/footer.css"]')) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "/css/footer.css";
    document.head.appendChild(stylesheet);
  }
  const footer = document.createElement("footer");
  footer.className = "site-footer";

  footer.innerHTML = `
    <div class="container">

      <!-- Brand -->
      <div>

        <strong id="footerName">
          ${escapeHtml(SITE_CONFIG.name || "")}
        </strong>

        <p id="footerDescription">
          ${escapeHtml(SITE_CONFIG.tagline || "")}
        </p>

      </div>

      <!-- Navigation -->
      <nav aria-label="Footer navigation">

        

        <a
          href="${escapeAttribute(
            SITE_CONFIG.navigation?.home || "/",
          )}"
        >
          Home
        </a>

        <a
          href="${escapeAttribute(
            SITE_CONFIG.navigation?.about || "/about/",
          )}"
        >
          About
        </a>

        <a
          href="${escapeAttribute(
            SITE_CONFIG.legal?.privacyUrl || "/privacy/",
          )}"
        >
          Privacy
        </a>

        <a
          href="${escapeAttribute(
            SITE_CONFIG.legal?.termsUrl || "/terms/",
          )}"
        >
          Terms
        </a>

        <a
          id="footerEmail"
          href="mailto:${escapeAttribute(
            SITE_CONFIG.contact?.email || "",
          )}"
        >
          Email
        </a>

        ${
          SITE_CONFIG.links?.github
            ? `
              <a
                id="footerGithub"
                href="${escapeAttribute(SITE_CONFIG.links.github)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            `
            : ""
        }

      </nav>

      <!-- Copyright -->
      <div class="copyright">

        ©
        <span id="footerYear">
          ${escapeHtml(
            SITE_CONFIG.copyright?.year ||
              new Date().getFullYear(),
          )}
        </span>

        <span id="footerCopyrightName">
          ${escapeHtml(
            SITE_CONFIG.copyright?.name ||
              SITE_CONFIG.name ||
              "",
          )}
        </span>.

        All rights reserved.

      </div>

    </div>
  `;

  document.body.appendChild(footer);
}

/* =======================================================
   HTML escaping
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
   Initialize
======================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initializeFooter();
});