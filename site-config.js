"use strict";

const SITE_CONFIG = {
  name: "Coder Basket",

  tagline:
    "Useful software, libraries, tools, and projects.",

  description:
    "A curated catalogue of useful software, libraries, tools, and projects.",

  url: "https://coderbasket.github.io",

  author: "Coder Basket",

  contact: {
    email: "coderbasketcontact@gmail.com",
  },

  links: {
    github: "https://github.com/coderbasket",
  },

  pages: {
    home: "/",
    about: "/about/",
    privacy: "/privacy/",
    terms: "/terms/",
  },

  services: {
    advertising: {
      enabled: true,
      provider: "Google AdSense",
      publisherId: "",
    },

    analytics: {
      enabled: true,
      provider: "Cloudflare Web Analytics",
    },
  },

  data: {
    usesLocalStorage: true,

    localStoragePurpose:
      "Remember catalogue section and category selections.",
  },

  copyright: {
    year: 2026,
  },
};