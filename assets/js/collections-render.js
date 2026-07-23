/* ================================================
   KLOZET KAARAN — COLLECTIONS GRID (dynamic render)
   ================================================
   services.html used to have all 23 product cards typed out
   by hand. That's why adding/removing a product or changing
   stock meant editing HTML. This file replaces that grid's
   contents by generating one card per product straight from
   window.KK_PRODUCTS (which stock-sync.js keeps up to date
   with whatever the admin panel has saved).

   Products are grouped into headed sections by category, in a
   fixed display order, matching the sidebar filter chips:
   Acid Wash -> Plain -> Terrain -> Printed Collection (Motorist
   Edition) -> Fan Edition -> Classic Cartoon -> Special Edition ->
   Women's -> Festive. A category with zero active products simply
   doesn't render a section (no empty headings). Any category not in
   this list (e.g. a new one added later) still renders, appended at
   the end, using its label from window.KK_COLLECTIONS.

   Runs on "kk:productsReady" (fired by stock-sync.js) so it
   always has the live catalog before it builds anything.
   No-ops on any page that doesn't have #productGrid.
================================================ */

(function () {
  "use strict";

  // Fixed display order + heading text for each section. "heading" is
  // literal display copy (kept separate from window.KK_COLLECTIONS.label,
  // which is still what the sidebar filter chips and Home page use) —
  // both are free to say different things without touching each other.
  const CATEGORY_ORDER = [
    { key: "acid-wash", heading: "Acid Wash Collection" },
    { key: "plain", heading: "Plain Collection" },
    { key: "terrain", heading: "Terrain Collection" },
    { key: "motorist", heading: "Printed Collection", subheading: "Motorist Edition" },
    { key: "fan-edition", heading: "Fan Edition" },
    { key: "classic-cartoon", heading: "Classic Cartoon Collection" },
    { key: "special-edition", heading: "Special Edition" },
    { key: "womens", heading: "Women's Collection" },
    { key: "festive", heading: "Festive Edition" },
  ];

  function formatRupees(n) {
    return "₹" + Number(n).toLocaleString("en-IN");
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function collectionLabel(key) {
    const collections = window.KK_COLLECTIONS || {};
    return (collections[key] && collections[key].label) || key;
  }

  function cardHtml(p) {
    const outOfStock = typeof p.stock === "number" && p.stock <= 0;
    const soldOutRibbon = outOfStock
      ? '<div class="kk-soldout-ribbon" style="position:absolute;top:12px;left:12px;z-index:5;' +
        "background:#141414;color:#fff;font-size:10px;font-weight:700;letter-spacing:0.15em;" +
        'padding:4px 10px;border:1px solid rgba(255,255,255,0.25);text-transform:uppercase;">SOLD OUT</div>'
      : "";
    const disabledAttrs = outOfStock ? 'disabled style="opacity:0.4;pointer-events:none;"' : "";
    const img = (p.images && p.images[0]) || "";
    const name = escapeHtml(p.title || "");
    const id = escapeHtml(p.id);

    return (
      '<div class="col-6 col-sm-6 col-xl-4" data-category="' + escapeHtml(p.category) + '">' +
        '<div class="product-card" style="min-width:0;">' +
          '<div class="kk-card-media" style="position:relative;">' +
            '<a href="product-detail.html?product=' + id + '" class="text-decoration-none">' +
              '<div class="product-card-image orange-glow-hover">' +
                '<img src="' + img + '" alt="' + name + '" loading="lazy" />' +
                soldOutRibbon +
                '<div class="product-card-hover-btn">' +
                  '<span class="btn-kk-primary d-flex align-items-center justify-content-center gap-2" style="width:100%; font-size:11px;">' +
                    '<span class="material-symbols-outlined" style="font-size:16px;">visibility</span> View Details' +
                  "</span>" +
                "</div>" +
              "</div>" +
            "</a>" +
            '<button class="kk-bookmark" data-product-id="' + id + '" aria-label="Save for later"><span class="material-symbols-outlined">bookmark_border</span></button>' +
            '<button class="kk-quick-add" data-product-id="' + id + '" aria-label="Quick add to cart" ' + disabledAttrs + '><span class="material-symbols-outlined" style="font-size:20px;">add</span></button>' +
          "</div>" +
          '<div class="d-flex justify-content-between align-items-center mt-2">' +
            "<div>" +
              '<a href="product-detail.html?product=' + id + '" class="text-decoration-none">' +
                '<p class="product-card-name" style="font-size:1rem; color:#fff; margin-bottom:0;">' + name.toUpperCase() + "</p>" +
              "</a>" +
              '<p class="product-card-sub">Unisex • Oversized</p>' +
            "</div>" +
            '<span class="product-card-price" style="font-size:1.2rem;">' + formatRupees(p.price) + "</span>" +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function groupHtml(entry, products) {
    if (!products.length) return ""; // no empty headings for categories with nothing active in them
    return (
      '<div class="kk-collection-group" data-category-group="' + entry.key + '" style="margin-bottom:48px;">' +
        '<div style="display:flex; align-items:baseline; gap:10px; margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08);">' +
          '<h3 style="font-family:var(--font-headline); text-transform:uppercase; letter-spacing:0.03em; font-size:1.3rem; margin:0; color:#fff;">' + entry.heading + "</h3>" +
          (entry.subheading
            ? '<span style="color:var(--color-muted); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em;">' + entry.subheading + "</span>"
            : "") +
        "</div>" +
        '<div class="row g-4">' + products.map(cardHtml).join("") + "</div>" +
      "</div>"
    );
  }

  function render() {
    const grid = document.getElementById("productGrid");
    if (!grid) return;

    const active = Object.values(window.KK_PRODUCTS || {}).filter(function (p) {
      return p.active !== false;
    });

    const byCategory = {};
    active.forEach(function (p) {
      (byCategory[p.category] = byCategory[p.category] || []).push(p);
    });

    const knownKeys = CATEGORY_ORDER.map(function (e) { return e.key; });
    const extraEntries = Object.keys(byCategory)
      .filter(function (k) { return knownKeys.indexOf(k) === -1; })
      .map(function (k) { return { key: k, heading: collectionLabel(k) }; });

    const sections = CATEGORY_ORDER.concat(extraEntries);

    grid.innerHTML = sections
      .map(function (entry) { return groupHtml(entry, byCategory[entry.key] || []); })
      .join("");

    document.dispatchEvent(new CustomEvent("kk:gridRendered"));

    // Re-run the site's stagger reveal now that this grid actually has
    // content — see assets/js/gsap.js for why this couldn't just rely
    // on the page-load pass.
    if (window.KK_applyStagger) {
      document.querySelectorAll(".kk-collection-group").forEach(window.KK_applyStagger);
    }

    // Cart.js wires up [data-product-id] buttons via one delegated
    // listener at the document level (per its DOM CONTRACT), so
    // freshly-injected buttons work without any extra binding here.
  }

  document.addEventListener("kk:productsReady", render);
})();
