/* ================================================
   KLOZET KAARAN — CART + WISHLIST ENGINE
   ================================================
   No backend, no login — everything lives in the browser's
   localStorage on that device. Works perfectly for a static
   Cloudflare Pages site with WhatsApp-based checkout.

   Depends on: assets/js/products-data.js (window.KK_PRODUCTS)
   must be loaded BEFORE this file on every page.

   WHAT THIS FILE DOES
   - Persists a cart (size + color + qty per line) and a
     wishlist (just product ids) in localStorage.
   - Injects the cart drawer, wishlist drawer, and the
     quick-add variant popover into every page automatically
     — no need to hand-write that markup per page.
   - Wires up any element already on the page carrying the
     right id/data-attributes (see the "DOM CONTRACT" comment
     below), so plain HTML pages "just work" once this script
     is included.
   - Builds the WhatsApp checkout message and hands off to
     wa.me — this is your "checkout", there is no payment
     step here by design.

   DOM CONTRACT (what your HTML needs to provide)
   - #kkCartBtn / #kkCartBadge      → nav cart icon + count
   - #kkWishlistBtn / #kkWishlistBadge → nav bookmark icon + count
   - Any element with [data-product-id="<id>"] AND class
     "kk-quick-add"  → opens the variant popover for that product
   - Any element with [data-product-id="<id>"] AND class
     "kk-bookmark"   → toggles that product in the wishlist
================================================ */

(function () {
  "use strict";

  /* ---------- CONFIG ---------- */
  // Replace with your real WhatsApp Business number (country code, no + or spaces).
  // This is the SAME placeholder already used in product-detail.html, centralized
  // here so you only ever have to change it in one place going forward.
  const WHATSAPP_NUMBER = "919025130407";

  const CART_KEY = "kk_cart";
  const WISHLIST_KEY = "kk_wishlist";

  /* ---------- STORAGE HELPERS ---------- */
  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn("KK storage read failed for", key, e);
      return fallback;
    }
  }
  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("KK storage write failed for", key, e);
    }
  }

  function getProduct(id) {
    return (window.KK_PRODUCTS || {})[id] || null;
  }

  function formatRupees(n) {
    return "₹" + Number(n).toLocaleString("en-IN");
  }

  /* ================================================
     CART
  ================================================ */
  const Cart = {
    getLines() {
      return readJSON(CART_KEY, []);
    },
    saveLines(lines) {
      writeJSON(CART_KEY, lines);
      renderCartDrawer();
      updateBadges();
    },
    add(productId, size, color, qty) {
      const lines = this.getLines();
      // Merge into an existing line if same product+size+color already in cart
      const existing = lines.find(
        (l) => l.productId === productId && l.size === size && l.color === color
      );
      if (existing) {
        existing.qty += qty;
      } else {
        lines.push({ productId, size, color, qty });
      }
      this.saveLines(lines);
    },
    updateQty(index, qty) {
      const lines = this.getLines();
      if (!lines[index]) return;
      if (qty <= 0) {
        lines.splice(index, 1);
      } else {
        lines[index].qty = qty;
      }
      this.saveLines(lines);
    },
    remove(index) {
      const lines = this.getLines();
      lines.splice(index, 1);
      this.saveLines(lines);
    },
    clear() {
      this.saveLines([]);
    },
    count() {
      return this.getLines().reduce((sum, l) => sum + l.qty, 0);
    },
    total() {
      return this.getLines().reduce((sum, l) => {
        const p = getProduct(l.productId);
        return sum + (p ? p.price * l.qty : 0);
      }, 0);
    }
  };

  /* ================================================
     WISHLIST (bookmark icon — no hearts here)
  ================================================ */
  const Wishlist = {
    getIds() {
      return readJSON(WISHLIST_KEY, []);
    },
    saveIds(ids) {
      writeJSON(WISHLIST_KEY, ids);
      renderWishlistDrawer();
      updateBadges();
      syncBookmarkButtons();
    },
    has(productId) {
      return this.getIds().indexOf(productId) !== -1;
    },
    toggle(productId) {
      const ids = this.getIds();
      const i = ids.indexOf(productId);
      if (i === -1) {
        ids.push(productId);
      } else {
        ids.splice(i, 1);
      }
      this.saveIds(ids);
    },
    count() {
      return this.getIds().length;
    }
  };

  /* ================================================
     BADGES (cart + wishlist counts in the nav)
  ================================================ */
  function updateBadges() {
    document.querySelectorAll("#kkCartBadge, .kk-cart-badge").forEach((el) => {
      const n = Cart.count();
      el.textContent = String(n);
      el.style.display = n > 0 ? "flex" : "none";
    });
    document.querySelectorAll("#kkWishlistBadge, .kk-wishlist-badge").forEach((el) => {
      const n = Wishlist.count();
      el.textContent = String(n);
      el.style.display = n > 0 ? "flex" : "none";
    });
  }

  function syncBookmarkButtons() {
    document.querySelectorAll(".kk-bookmark[data-product-id]").forEach((btn) => {
      const id = btn.getAttribute("data-product-id");
      const saved = Wishlist.has(id);
      btn.classList.toggle("active", saved);
      const icon = btn.querySelector(".material-symbols-outlined");
      if (icon) icon.textContent = saved ? "bookmark" : "bookmark_border";
      btn.setAttribute("aria-pressed", saved ? "true" : "false");
    });
  }

  /* ================================================
     DRAWER SHELLS — injected once into the page
  ================================================ */
  function ensureDrawers() {
    if (document.getElementById("kkCartDrawer")) return; // already injected

    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="kk-drawer-overlay" id="kkDrawerOverlay"></div>

      <aside class="kk-drawer" id="kkCartDrawer" aria-label="Shopping cart">
        <div class="kk-drawer-head">
          <h3>YOUR CART</h3>
          <button class="kk-drawer-close" id="kkCartClose" aria-label="Close cart">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="kk-drawer-body" id="kkCartBody"></div>
        <div class="kk-drawer-foot" id="kkCartFoot"></div>
      </aside>

      <aside class="kk-drawer" id="kkWishlistDrawer" aria-label="Saved items">
        <div class="kk-drawer-head">
          <h3>SAVED ITEMS</h3>
          <button class="kk-drawer-close" id="kkWishlistClose" aria-label="Close saved items">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="kk-drawer-body" id="kkWishlistBody"></div>
      </aside>

      <div class="kk-popover-overlay" id="kkPopoverOverlay"></div>
      <div class="kk-popover" id="kkPopover" role="dialog" aria-label="Choose size and color"></div>
    `;
    document.body.appendChild(wrap);

    document.getElementById("kkDrawerOverlay").addEventListener("click", closeAllDrawers);
    document.getElementById("kkCartClose").addEventListener("click", closeAllDrawers);
    document.getElementById("kkWishlistClose").addEventListener("click", closeAllDrawers);
    document.getElementById("kkPopoverOverlay").addEventListener("click", closePopover);
  }

  function openDrawer(which) {
    ensureDrawers();
    document.getElementById("kkDrawerOverlay").classList.add("open");
    document.getElementById(which === "cart" ? "kkCartDrawer" : "kkWishlistDrawer").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeAllDrawers() {
    document.querySelectorAll(".kk-drawer").forEach((d) => d.classList.remove("open"));
    const overlay = document.getElementById("kkDrawerOverlay");
    if (overlay) overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ================================================
     RENDER: CART DRAWER
  ================================================ */
  function renderCartDrawer() {
    const body = document.getElementById("kkCartBody");
    const foot = document.getElementById("kkCartFoot");
    if (!body || !foot) return;

    const lines = Cart.getLines();

    if (lines.length === 0) {
      body.innerHTML = `<p class="kk-drawer-empty">Your cart is empty. Go find something worth wearing.</p>`;
      foot.innerHTML = "";
      return;
    }

    body.innerHTML = lines.map((line, index) => {
      const p = getProduct(line.productId);
      if (!p) return "";
      const lineTotal = p.price * line.qty;
      return `
        <div class="kk-line-item">
          <img src="${p.images[0]}" alt="${p.title}" />
          <div class="kk-line-info">
            <p class="kk-line-title">${p.title}</p>
            <p class="kk-line-meta">Size: ${line.size} • Color: ${line.color}</p>
            <div class="kk-qty-stepper">
              <button class="kk-qty-btn" data-action="dec" data-index="${index}" aria-label="Decrease quantity">−</button>
              <span>${line.qty}</span>
              <button class="kk-qty-btn" data-action="inc" data-index="${index}" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <div class="kk-line-right">
            <button class="kk-line-remove" data-action="remove" data-index="${index}" aria-label="Remove item">
              <span class="material-symbols-outlined">delete</span>
            </button>
            <span class="kk-line-price">${formatRupees(lineTotal)}</span>
          </div>
        </div>
      `;
    }).join("");

    foot.innerHTML = `
      <div class="kk-total-row">
        <span>Total</span>
        <span>${formatRupees(Cart.total())}</span>
      </div>
      <button class="btn-kk-primary w-100 py-3 d-flex align-items-center justify-content-center gap-2 fw-bold text-uppercase" id="kkCheckoutBtn" style="border:none;">
        Checkout via WhatsApp
        <span class="material-symbols-outlined">chat</span>
      </button>
    `;

    body.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number(btn.getAttribute("data-index"));
        const action = btn.getAttribute("data-action");
        const currentLines = Cart.getLines();
        if (!currentLines[index]) return;
        if (action === "inc") Cart.updateQty(index, currentLines[index].qty + 1);
        if (action === "dec") Cart.updateQty(index, currentLines[index].qty - 1);
        if (action === "remove") Cart.remove(index);
      });
    });

    const checkoutBtn = document.getElementById("kkCheckoutBtn");
    if (checkoutBtn) checkoutBtn.addEventListener("click", checkoutViaWhatsApp);
  }

  /* ================================================
     RENDER: WISHLIST DRAWER
  ================================================ */
  function renderWishlistDrawer() {
    const body = document.getElementById("kkWishlistBody");
    if (!body) return;

    const ids = Wishlist.getIds();

    if (ids.length === 0) {
      body.innerHTML = `<p class="kk-drawer-empty">Nothing saved yet. Tap the bookmark on anything you like.</p>`;
      return;
    }

    body.innerHTML = ids.map((id) => {
      const p = getProduct(id);
      if (!p) return "";
      return `
        <div class="kk-line-item">
          <img src="${p.images[0]}" alt="${p.title}" />
          <div class="kk-line-info">
            <p class="kk-line-title">${p.title}</p>
            <p class="kk-line-meta">${formatRupees(p.price)}</p>
            <button class="kk-mini-btn" data-action="move-to-cart" data-id="${id}">Add to Cart</button>
          </div>
          <div class="kk-line-right">
            <button class="kk-line-remove" data-action="unsave" data-id="${id}" aria-label="Remove from saved">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      `;
    }).join("");

    body.querySelectorAll("[data-action='unsave']").forEach((btn) => {
      btn.addEventListener("click", () => Wishlist.toggle(btn.getAttribute("data-id")));
    });
    body.querySelectorAll("[data-action='move-to-cart']").forEach((btn) => {
      btn.addEventListener("click", () => openVariantPopover(btn.getAttribute("data-id"), btn));
    });
  }

  /* ================================================
     VARIANT-PICKER POPOVER (quick add from any grid card)
  ================================================ */
  let popoverProductId = null;

  function openVariantPopover(productId, anchorEl) {
    ensureDrawers();
    const p = getProduct(productId);
    if (!p) return;
    popoverProductId = productId;

    const pop = document.getElementById("kkPopover");
    pop.innerHTML = `
      <div class="kk-popover-head">
        <img src="${p.images[0]}" alt="${p.title}" />
        <div>
          <p class="kk-popover-title">${p.title}</p>
          <p class="kk-popover-price">${formatRupees(p.price)}</p>
        </div>
        <button class="kk-drawer-close" id="kkPopoverClose" aria-label="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="kk-popover-section">
        <p class="kk-popover-label">Size</p>
        <div class="kk-size-row">
          ${p.sizes.map((s, i) => `<button class="kk-size-btn ${i === 0 ? "active" : ""}" data-size="${s}">${s}</button>`).join("")}
        </div>
      </div>

      <div class="kk-popover-section">
        <p class="kk-popover-label">Color</p>
        <div class="kk-color-row">
          ${p.colors.map((c, i) => `
            <button class="kk-color-swatch ${i === 0 ? "active" : ""}" data-color="${c.name}" style="background:${c.hex};" title="${c.name}"></button>
          `).join("")}
        </div>
        <p class="kk-color-name" id="kkColorName">${p.colors[0].name}</p>
      </div>

      <div class="kk-popover-section kk-popover-qty-row">
        <p class="kk-popover-label">Qty</p>
        <div class="kk-qty-stepper">
          <button class="kk-qty-btn" id="kkPopQtyMinus" aria-label="Decrease quantity">−</button>
          <span id="kkPopQtyValue">1</span>
          <button class="kk-qty-btn" id="kkPopQtyPlus" aria-label="Increase quantity">+</button>
        </div>
      </div>

      <button class="btn-kk-primary w-100 py-3 fw-bold text-uppercase" id="kkPopoverAdd" style="border:none;">
        Add to Cart
      </button>
    `;

    let selectedSize = p.sizes[0];
    let selectedColor = p.colors[0].name;
    let qty = 1;

    pop.querySelectorAll(".kk-size-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        pop.querySelectorAll(".kk-size-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedSize = btn.getAttribute("data-size");
      });
    });
    pop.querySelectorAll(".kk-color-swatch").forEach((btn) => {
      btn.addEventListener("click", () => {
        pop.querySelectorAll(".kk-color-swatch").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedColor = btn.getAttribute("data-color");
        document.getElementById("kkColorName").textContent = selectedColor;
      });
    });
    document.getElementById("kkPopQtyMinus").addEventListener("click", () => {
      qty = Math.max(1, qty - 1);
      document.getElementById("kkPopQtyValue").textContent = String(qty);
    });
    document.getElementById("kkPopQtyPlus").addEventListener("click", () => {
      qty += 1;
      document.getElementById("kkPopQtyValue").textContent = String(qty);
    });
    document.getElementById("kkPopoverClose").addEventListener("click", closePopover);
    document.getElementById("kkPopoverAdd").addEventListener("click", () => {
      Cart.add(productId, selectedSize, selectedColor, qty);
      closePopover();
      openDrawer("cart");
    });

    document.getElementById("kkPopoverOverlay").classList.add("open");
    pop.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closePopover() {
    const pop = document.getElementById("kkPopover");
    const overlay = document.getElementById("kkPopoverOverlay");
    if (pop) pop.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
    if (!document.querySelector(".kk-drawer.open")) {
      document.body.style.overflow = "";
    }
    popoverProductId = null;
  }

  /* ================================================
     WHATSAPP CHECKOUT — full order summary
  ================================================ */
  function checkoutViaWhatsApp() {
    const lines = Cart.getLines();
    if (lines.length === 0) return;

    let message = "Hey KLOZET KAARAN, I'd like to order:\n\n";
    lines.forEach((line, i) => {
      const p = getProduct(line.productId);
      if (!p) return;
      const lineTotal = p.price * line.qty;
      message += `${i + 1}. ${p.title}\n`;
      message += `   Size: ${line.size} | Color: ${line.color} | Qty: ${line.qty}\n`;
      message += `   ${formatRupees(p.price)} each = ${formatRupees(lineTotal)}\n\n`;
    });
    message += `Total: ${formatRupees(Cart.total())}\n\nPlease confirm availability!`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener");
  }

  /* ================================================
     EVENT DELEGATION — quick-add / bookmark buttons
     anywhere on the page, present or added later.
  ================================================ */
  function bindGlobalClicks() {
    document.addEventListener("click", function (e) {
      const quickAddBtn = e.target.closest(".kk-quick-add[data-product-id]");
      if (quickAddBtn) {
        e.preventDefault();
        openVariantPopover(quickAddBtn.getAttribute("data-product-id"), quickAddBtn);
        return;
      }

      const bookmarkBtn = e.target.closest(".kk-bookmark[data-product-id]");
      if (bookmarkBtn) {
        e.preventDefault();
        Wishlist.toggle(bookmarkBtn.getAttribute("data-product-id"));
        return;
      }
    });

    document.querySelectorAll("#kkCartBtn, .kk-cart-trigger").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openDrawer("cart");
      });
    });
    document.querySelectorAll("#kkWishlistBtn, .kk-wishlist-trigger").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openDrawer("wishlist");
      });
    });
  }

  /* ================================================
     PRODUCT PAGE HOOK (product-detail.html)
     Exposed so that page's own inline script can call it
     once it knows which product is being viewed.
  ================================================ */
  window.KKCartAPI = {
    addToCart: function (productId, size, color, qty) {
      Cart.add(productId, size, color, qty || 1);
      openDrawer("cart");
    },
    isSaved: function (productId) {
      return Wishlist.has(productId);
    },
    toggleSaved: function (productId) {
      Wishlist.toggle(productId);
    }
  };

  /* ---------- INIT ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    ensureDrawers();
    bindGlobalClicks();
    renderCartDrawer();
    renderWishlistDrawer();
    updateBadges();
    syncBookmarkButtons();
  });
})();
