/* ================================================
   KLOZET KAARAN — HOME PAGE DYNAMIC SECTIONS
   ================================================
   Phase 1 (Home page only — Collections and Product Detail are not
   touched by this file).

   Runs once, on "kk:productsReady" (fired by assets/js/stock-sync.js
   after it loads the same live catalog Collections uses) — same
   single-fetch, single-source pattern as the rest of the site. Updates:

   1. Live Drop Status — pulls Karuppu Core's real image, name,
      category, and stock.
   2. Special Edition (dashboard panel) — pulls Lava Rust's real
      image, name, category, price, and stock.

   The hero collection-orbit cards (Acid Wash / Printed Collection /
   Special Edition) are intentionally NOT wired here — those images
   and labels are hardcoded directly in index.html by request, so
   this curated 3-card section stays predictable rather than picking
   an arbitrary "first product" per category. If you want those
   images to update automatically again later, that's a one-line
   change to reintroduce (ask, and it can come back).

   If a referenced product can't be found (renamed/deleted in admin),
   this leaves that section's existing static content alone rather
   than showing something broken.
================================================ */

(function () {
  "use strict";

  function formatRupees(n) {
    return "₹" + Number(n).toLocaleString("en-IN");
  }

  function collectionLabel(key) {
    const collections = window.KK_COLLECTIONS || {};
    return (collections[key] && collections[key].label) || key;
  }

  // ---------- Live Drop Status / Special Edition (dashboard panels) ----------
  // Looked up by id first (exact, stable even if the title is edited
  // later), falling back to name lookup — demonstrates both reusable
  // helpers from products-data.js per the Home-page spec.
  function findSpotlightProduct(id, name) {
    return window.KK_getProductById(id) || window.KK_getProductByName(name);
  }

  function syncSpotlightPanel(product, opts) {
    if (!product || product.active === false) return; // leave static fallback as-is

    const img = document.querySelector('[data-role="' + opts.prefix + '-img"]');
    if (img && product.images && product.images[0]) img.src = product.images[0];

    const nameEl = document.querySelector('[data-role="' + opts.prefix + '-name"]');
    if (nameEl) nameEl.textContent = product.title;

    const subEl = document.querySelector('[data-role="' + opts.prefix + '-sub"]');
    if (subEl) {
      const label = collectionLabel(product.category);
      subEl.textContent = opts.showPrice
        ? label + " · " + formatRupees(product.price)
        : label + " · Oversized Tee";
    }

    const stockEl = document.querySelector('[data-role="' + opts.prefix + '-stock"]');
    if (stockEl && typeof product.stock === "number") {
      stockEl.textContent = product.stock;
    }

    const ctaEl = document.querySelector('[data-role="' + opts.prefix + '-cta"]');
    if (ctaEl) ctaEl.setAttribute("href", "product-detail.html?product=" + encodeURIComponent(product.id));
  }

  function init() {
    syncSpotlightPanel(
      findSpotlightProduct("karuppu-core", "Karuppu Core"),
      { prefix: "live-drop", showPrice: false }
    );
    syncSpotlightPanel(
      findSpotlightProduct("lava-rust", "Lava Rust"),
      { prefix: "special-edition", showPrice: true }
    );
  }

  document.addEventListener("kk:productsReady", init);
})();
