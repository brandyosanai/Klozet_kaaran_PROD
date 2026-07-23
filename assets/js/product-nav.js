/* ================================================
   KLOZET KAARAN — HOME PAGE CARD NAVIGATION
   ================================================
   The Home page's "New Drop", "Color Drop", and mood-grid sections
   were built with no <a> link around the image at all — only the
   bookmark/quick-add buttons were clickable. This makes the rest of
   each card clickable too, taking the visitor to the correct
   product-detail.html?product=<id> page — the same id used by that
   card's own bookmark/quick-add buttons (data-product-id), so it's
   always the right product, never stale/local data.

   Clicks on an actual <button> or <a> inside the card (bookmark,
   quick-add, any existing link) are left alone so those keep working
   exactly as before.
================================================ */

(function () {
  "use strict";

  const CLICKABLE_CARD_SELECTORS = [
    ".kk-runway-card",
    ".kk-field-item",
    ".kk-colordrop-card",
    ".kk-mood-tile",
  ];

  function wireCard(card) {
    if (card.dataset.kkNavBound) return;
    card.dataset.kkNavBound = "1";

    const idHolder = card.querySelector("[data-product-id]");
    if (!idHolder) return;
    const id = idHolder.getAttribute("data-product-id");

    card.style.cursor = "pointer";
    card.addEventListener("click", function (e) {
      // Don't hijack clicks on buttons or existing links inside the card
      // (bookmark, quick-add, or the .kk-field-item title link).
      if (e.target.closest("button, a")) return;
      window.location.href = "product-detail.html?product=" + encodeURIComponent(id);
    });
  }

  function wireAll() {
    CLICKABLE_CARD_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(wireCard);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireAll);
  } else {
    wireAll();
  }
})();
