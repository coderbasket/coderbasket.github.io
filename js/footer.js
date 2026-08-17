"use strict";

function initializeFooter() {
  const footerName = document.getElementById("footerName");
  const footerDescription = document.getElementById("footerDescription");
  const footerEmail = document.getElementById("footerEmail");
  const footerGithub = document.getElementById("footerGithub");
  const footerYear = document.getElementById("footerYear");

  if (footerName) {
    footerName.textContent = SITE_CONFIG.name;
  }

  if (footerDescription) {
    footerDescription.textContent = SITE_CONFIG.tagline;
  }

  if (footerEmail) {
    footerEmail.href = `mailto:${SITE_CONFIG.contact.email}`;
    footerEmail.textContent = "Email";
  }

  if (footerGithub) {
    footerGithub.href = SITE_CONFIG.links.github;
  }

  if (footerYear) {
    footerYear.textContent = SITE_CONFIG.copyright.year;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializeFooter();
});