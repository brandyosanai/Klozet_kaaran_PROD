/* ================================================
   KLOZET KAARAN — LIVE STOCK SYNC
   ================================================
   Loads right after products-data.js and before cart.js/main.js
   on every page. Pulls whatever the admin last saved from
   /admin.html (stored via /api/products) and:

   1. Replaces window.KK_PRODUCTS with the live catalog, so any
      new/edited/removed product is reflected everywhere that
      reads window.KK_PRODUCTS (cart, product-detail, and the
      Collections grid which is now rendered from this data).
   2. Sweeps every hand-written product card already in the HTML
      (home page, Collections page fallback) and:
        - hides the card if that product was deleted or set
          inactive by the admin
        - shows a SOLD OUT ribbon + disables Add-to-Cart if
          stock is 0
        - updates the visible price if the admin changed it
   3. Fires a "kk:productsReady" event once done, so other
      scripts (the Collections grid renderer, main.js's filter
      init) know it's safe to build/rebuild from live data.

   If the fetch fails or nothing has been saved yet, the page
   just keeps using the bundled defaults from products-data.js —
   nothing breaks.
================================================ */

(function () {
  "use strict";

  function formatRupees(n) {
    return "₹" + Number(n).toLocaleString("en-IN");
  }

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
    const live = await fetchLiveCatalog();
    if (live && live.products) {
      window.KK_PRODUCTS = live.products;
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
