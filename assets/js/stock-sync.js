/* ================================================
   KLOZET KAARAN — LIVE STOCK SYNC
   ================================================
   This is the ONLY place that fetches the product catalog on any
   page. It runs once per page load, replaces window.KK_PRODUCTS
   with whatever the admin last saved (via /admin.html -> /api/products),
   then fires "kk:productsReady" exactly once. Every other script
   (collections-render.js, product-detail.html, cart.js, product-nav.js,
   this file's own reflectOnStaticCards) reads window.KK_PRODUCTS —
   nothing else fetches or holds its own copy. That's what keeps
   Home / Collections / Product Detail / Cart in sync: they're all
   reading the same in-memory object, updated in one place.

   assets/js/products-data.js (loaded just before this file) provides
   the bundled fallback/seed data. It is NOT a second source of truth —
   it's only ever used until this script's fetch resolves, or if the
   API is unreachable. Once the fetch succeeds, this file REPLACES
   window.KK_PRODUCTS entirely with the live catalog.

   What this file does, in order:
   1. Fetch the live catalog once.
   2. Normalize it (see normalizeProducts) so old-format products
      (a bare "image" string instead of an "images" array) don't
      break anything — converted automatically, in memory only.
   3. Replace window.KK_PRODUCTS with the normalized live data.
   4. Sweep every hand-written product card already in the page's
      HTML (Home page sections, and any static fallback markup) and
      sync image, price, and sold-out state to match.
   5. Fire "kk:productsReady" — this is the ONE signal every other
      script waits for before building/rendering product UI, so nothing
      on the page ever builds twice or shows two different states.

   If the fetch fails or nothing has been saved yet, the page keeps
   using the bundled defaults from products-data.js — nothing breaks,
   it just means "no admin edits have landed yet."
================================================ */

(function () {
  "use strict";

  function formatRupees(n) {
    return "₹" + Number(n).toLocaleString("en-IN");
  }

  // Issue 7 backward-compatibility: some very old records (or a bad
  // manual edit) might still have `image: "url"` instead of
  // `images: ["url", ...]`. Normalize once, in memory, so every
  // consumer can always assume `images` is an array.
  function normalizeProducts(products) {
    Object.keys(products || {}).forEach(function (id) {
      const p = products[id];
      if (!p) return;
      if ((!Array.isArray(p.images) || p.images.length === 0) && p.image) {
        p.images = [p.image];
      }
      if (!Array.isArray(p.images)) {
        p.images = [];
      }
    });
    return products;
  }
  window.KK_normalizeProducts = normalizeProducts;

  async function fetchLiveCatalog() {
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.products && Object.keys(data.products).length) {
        return data;
      }
      return null;
    } catch (e) {
      console.warn("KK stock-sync: live catalog unavailable, using bundled defaults.", e);
      return null;
    }
  }

  // Each home-page "chapter" uses its own hand-styled card markup —
  // they don't all share the .product-card class Collections uses.
  // Listed most-specific-first; whichever matches closest to the
  // button wins.
  const CARD_TYPES = [
    { card: ".product-card",      media: ".kk-card-media",   price: ".product-card-price" },
    { card: ".kk-field-item",     media: ".kk-field-media",  price: ".kk-field-price" },
    { card: ".kk-colordrop-card", media: null,               price: ".kk-colordrop-bottom > span" },
    { card: ".kk-runway-card",    media: null,               price: null },
    { card: ".kk-mood-tile",      media: null,               price: null },
  ];

  function findCard(btn) {
    for (const type of CARD_TYPES) {
      const card = btn.closest(type.card);
      if (card) return { card, type };
    }
    // Fallback for any layout not listed above.
    return { card: btn.parentElement, type: { card: null, media: null, price: null } };
  }

  function reflectOnStaticCards() {
    const products = window.KK_PRODUCTS || {};
    const ids = new Set();
    document.querySelectorAll("[data-product-id]").forEach(function (el) {
      ids.add(el.getAttribute("data-product-id"));
    });

    ids.forEach(function (id) {
      const product = products[id];
      const anyBtn = document.querySelector('[data-product-id="' + CSS.escape(id) + '"]');
      if (!anyBtn) return;

      const { card, type } = findCard(anyBtn);
      if (!card) return;

      const deleted = !product || product.active === false;
      if (deleted) {
        card.style.display = "none";
        return;
      }
      card.style.display = "";

      // Update visible price if the admin changed it (only where
      // this card layout actually shows a price).
      if (type.price && typeof product.price === "number") {
        const priceEl = card.querySelector(type.price);
        if (priceEl) priceEl.textContent = formatRupees(product.price);
      }

      // Update the product image if the admin changed it. Every card
      // type here has exactly one product photo, so the first <img>
      // inside the card is always the right one. This was the root
      // cause of "image doesn't update on Home" — this pass simply
      // never touched <img src> before.
      if (product.images && product.images[0]) {
        const imgEl = card.querySelector("img");
        if (imgEl && imgEl.getAttribute("src") !== product.images[0]) {
          imgEl.src = product.images[0];
        }
      }

      // Sold out handling.
      const outOfStock = typeof product.stock === "number" && product.stock <= 0;
      let ribbon = card.querySelector(".kk-soldout-ribbon");
      const media = (type.media && card.querySelector(type.media)) || card;

      if (outOfStock) {
        if (!ribbon) {
          ribbon = document.createElement("div");
          ribbon.className = "kk-soldout-ribbon";
          ribbon.textContent = "SOLD OUT";
          ribbon.style.cssText =
            "position:absolute;top:12px;left:12px;z-index:5;background:#141414;" +
            "color:#fff;font-size:10px;font-weight:700;letter-spacing:0.15em;" +
            "padding:4px 10px;border:1px solid rgba(255,255,255,0.25);text-transform:uppercase;";
          if (getComputedStyle(media).position === "static") {
            media.style.position = "relative";
          }
          media.appendChild(ribbon);
        }
        card.querySelectorAll(".kk-quick-add").forEach(function (btn) {
          btn.disabled = true;
          btn.style.opacity = "0.4";
          btn.style.pointerEvents = "none";
        });
      } else if (ribbon) {
        ribbon.remove();
        card.querySelectorAll(".kk-quick-add").forEach(function (btn) {
          btn.disabled = false;
          btn.style.opacity = "";
          btn.style.pointerEvents = "";
        });
      }
    });
  }

  async function init() {
    // Normalize the bundled seed data too, in case it's ever hand-edited
    // into the old single-image format.
    normalizeProducts(window.KK_PRODUCTS || {});

    const live = await fetchLiveCatalog();
    if (live && live.products) {
      window.KK_PRODUCTS = normalizeProducts(live.products);
      if (live.collections) window.KK_COLLECTIONS = live.collections;
    }
    reflectOnStaticCards();
    document.dispatchEvent(new CustomEvent("kk:productsReady"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
