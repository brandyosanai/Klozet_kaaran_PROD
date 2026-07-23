/* ================================================
   KLOZET KAARAN — COLLECTIONS GRID (dynamic render)
   ================================================
   services.html used to have all 23 product cards typed out
   by hand. That's why adding/removing a product or changing
   stock meant editing HTML. This file replaces that grid's
   contents by generating one card per product straight from
   window.KK_PRODUCTS (which stock-sync.js keeps up to date
   with whatever the admin panel has saved).

   Runs on "kk:productsReady" (fired by stock-sync.js) so it
   always has the live catalog before it builds anything.
   No-ops on any page that doesn't have #productGrid.
================================================ */

(function () {
  "use strict";

  function formatRupees(n) {
    return "₹" + Number(n).toLocaleString("en-IN");
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
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

  function render() {
    const grid = document.getElementById("productGrid");
    if (!grid) return;

    const products = Object.values(window.KK_PRODUCTS || {}).filter(function (p) {
      return p.active !== false;
    });

    grid.innerHTML = products.map(cardHtml).join("");

    document.dispatchEvent(new CustomEvent("kk:gridRendered"));

    // Cart.js wires up [data-product-id] buttons via one delegated
    // listener at the document level (per its DOM CONTRACT), so
    // freshly-injected buttons work without any extra binding here.
  }

  document.addEventListener("kk:productsReady", render);
})();
