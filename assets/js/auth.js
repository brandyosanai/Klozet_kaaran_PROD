/* ================================================
   KLOZET KAARAN — CUSTOMER ACCOUNTS
   ================================================
   Talks to functions/api/auth/*.js and functions/api/account.js
   (Cloudflare Pages Functions + the same KK_KV namespace already
   used for the product catalog — see ADMIN-SETUP.md for the KV/env
   setup this depends on; it additionally needs a SESSION_SECRET
   environment variable, see AUTH-SETUP.md).

   What this adds, without touching any existing page's HTML by hand:
   - An account icon injected into the header (next to the cart icon)
     on every page that already loads cart.js.
   - A login/signup modal, and a logged-in "Signed in as ..." /
     Log Out view.
   - Cross-device sync: on login, this account's saved wishlist/cart
     from the server is MERGED with whatever's already in this
     browser (union of wishlist ids; cart lines combined, summing
     quantity for matching product+size+color) — so logging in on a
     new device never silently discards something you just added as
     a guest. The merged result is saved back to the server too, so
     the next device that logs in sees everything.
   - After that, any local wishlist/cart change (via the existing
     Cart/Wishlist code in cart.js) is pushed to the server automatically
     while logged in, debounced, via the KK_onAccountDataChange hook.

   Guests (not logged in) see no behavior change at all — wishlist/cart
   stay exactly as before, local to that browser.
================================================ */

(function () {
  "use strict";

  let currentEmail = null;
  let pushTimer = null;

  function api(path, opts) {
    return fetch(path, Object.assign({ headers: { "content-type": "application/json" } }, opts || {}))
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || "Something went wrong");
          return data;
        });
      });
  }

  /* ---------- Header icon ---------- */
  function injectAccountIcon() {
    const cartBtn = document.getElementById("kkCartBtn");
    if (!cartBtn || document.getElementById("kkAccountBtn")) return;

    const btn = document.createElement("button");
    btn.id = "kkAccountBtn";
    btn.setAttribute("aria-label", "Account");
    btn.style.cssText = "background:none;border:none;color:#fff;cursor:pointer;position:relative;";
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:24px;">person</span>';
    btn.addEventListener("click", openModal);
    cartBtn.parentElement.insertBefore(btn, cartBtn);
  }

  function updateIcon() {
    const btn = document.getElementById("kkAccountBtn");
    if (!btn) return;
    btn.querySelector(".material-symbols-outlined").textContent = currentEmail ? "person" : "person";
    btn.style.color = currentEmail ? "#f58220" : "#fff";
    btn.title = currentEmail ? "Signed in as " + currentEmail : "Log in / Sign up";
  }

  /* ---------- Modal ---------- */
  function ensureModal() {
    if (document.getElementById("kkAccountModal")) return;

    const wrap = document.createElement("div");
    wrap.id = "kkAccountModal";
    wrap.style.cssText =
      "display:none;position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,0.6);" +
      "align-items:center;justify-content:center;padding:20px;";
    wrap.innerHTML =
      '<div style="background:var(--color-surface,#141414);border:1px solid var(--color-dimmer,#333);' +
      'max-width:380px;width:100%;padding:28px;position:relative;">' +
        '<button id="kkAccountClose" aria-label="Close" style="position:absolute;top:14px;right:14px;background:none;border:none;color:#fff;cursor:pointer;">' +
          '<span class="material-symbols-outlined">close</span>' +
        "</button>" +
        '<div id="kkAccountBody"></div>' +
      "</div>";
    document.body.appendChild(wrap);

    wrap.addEventListener("click", function (e) { if (e.target === wrap) closeModal(); });
    document.getElementById("kkAccountClose").addEventListener("click", closeModal);
  }

  function openModal() {
    ensureModal();
    renderModalBody();
    document.getElementById("kkAccountModal").style.display = "flex";
  }
  function closeModal() {
    const m = document.getElementById("kkAccountModal");
    if (m) m.style.display = "none";
  }

  function fieldStyle() {
    return "width:100%;background:var(--color-surface-2,#1c1c1c);border:1px solid var(--color-dimmer,#333);" +
           "color:#fff;padding:10px 12px;font-family:var(--font-body,inherit);font-size:0.9rem;margin-bottom:10px;";
  }
  function btnStyle(primary) {
    return primary
      ? "width:100%;background:var(--color-primary,#f58220);color:#000;border:none;padding:11px;font-weight:700;" +
        "text-transform:uppercase;letter-spacing:0.05em;font-size:0.8rem;cursor:pointer;"
      : "width:100%;background:transparent;color:#fff;border:1px solid var(--color-dimmer,#333);padding:11px;" +
        "font-weight:700;text-transform:uppercase;letter-spacing:0.05em;font-size:0.8rem;cursor:pointer;margin-top:8px;";
  }

  function renderModalBody() {
    const body = document.getElementById("kkAccountBody");

    if (currentEmail) {
      body.innerHTML =
        '<p style="font-family:var(--font-headline,inherit);text-transform:uppercase;font-size:1.1rem;color:#fff;margin-bottom:6px;">Account</p>' +
        '<p style="color:var(--color-muted,#999);font-size:0.85rem;margin-bottom:20px;">Signed in as ' + escapeHtml(currentEmail) + "</p>" +
        '<p style="color:var(--color-muted,#999);font-size:0.78rem;margin-bottom:20px;">Your saved items and cart sync automatically across any device you log into.</p>' +
        '<button id="kkLogoutBtn" style="' + btnStyle(true) + '">Log Out</button>';
      document.getElementById("kkLogoutBtn").addEventListener("click", doLogout);
      return;
    }

    body.innerHTML =
      '<div style="display:flex;gap:16px;margin-bottom:20px;">' +
        '<button data-tab="login" class="kk-auth-tab" style="background:none;border:none;color:#fff;font-weight:700;text-transform:uppercase;font-size:0.85rem;padding-bottom:6px;border-bottom:2px solid var(--color-primary,#f58220);cursor:pointer;">Log In</button>' +
        '<button data-tab="signup" class="kk-auth-tab" style="background:none;border:none;color:var(--color-muted,#999);font-weight:700;text-transform:uppercase;font-size:0.85rem;padding-bottom:6px;border-bottom:2px solid transparent;cursor:pointer;">Sign Up</button>' +
      "</div>" +
      '<div id="kkAuthError" style="display:none;color:#ffb3b3;font-size:0.8rem;margin-bottom:12px;"></div>' +
      '<form id="kkAuthForm">' +
        '<input type="email" id="kkAuthEmail" placeholder="Email" autocomplete="email" style="' + fieldStyle() + '" />' +
        '<input type="password" id="kkAuthPassword" placeholder="Password" autocomplete="current-password" style="' + fieldStyle() + '" />' +
        '<button type="submit" id="kkAuthSubmit" style="' + btnStyle(true) + '">Log In</button>' +
      "</form>";

    let mode = "login";
    const tabs = body.querySelectorAll(".kk-auth-tab");
    const submitBtn = document.getElementById("kkAuthSubmit");
    const passwordInput = document.getElementById("kkAuthPassword");

    function setMode(next) {
      mode = next;
      tabs.forEach(function (t) {
        const active = t.getAttribute("data-tab") === mode;
        t.style.color = active ? "#fff" : "var(--color-muted,#999)";
        t.style.borderBottomColor = active ? "var(--color-primary,#f58220)" : "transparent";
      });
      submitBtn.textContent = mode === "login" ? "Log In" : "Create Account";
      passwordInput.setAttribute("autocomplete", mode === "login" ? "current-password" : "new-password");
      document.getElementById("kkAuthError").style.display = "none";
    }
    tabs.forEach(function (t) { t.addEventListener("click", function () { setMode(t.getAttribute("data-tab")); }); });

    document.getElementById("kkAuthForm").addEventListener("submit", function (e) {
      e.preventDefault();
      const email = document.getElementById("kkAuthEmail").value.trim();
      const password = document.getElementById("kkAuthPassword").value;
      const errEl = document.getElementById("kkAuthError");
      errEl.style.display = "none";

      if (!email || !password) {
        errEl.textContent = "Enter your email and password.";
        errEl.style.display = "block";
        return;
      }

      submitBtn.disabled = true;
      const call = mode === "login"
        ? api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) })
        : api("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) });

      call
        .then(function (data) {
          currentEmail = data.email;
          updateIcon();
          return syncAfterLogin();
        })
        .then(function () {
          renderModalBody();
        })
        .catch(function (err) {
          errEl.textContent = err.message;
          errEl.style.display = "block";
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });
  }

  function doLogout() {
    api("/api/auth/logout", { method: "POST" }).finally(function () {
      currentEmail = null;
      updateIcon();
      closeModal();
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Sync ---------- */
  function mergeWishlist(serverIds, localIds) {
    const set = new Set(serverIds);
    localIds.forEach(function (id) { set.add(id); });
    return Array.from(set);
  }

  function mergeCart(serverLines, localLines) {
    const merged = serverLines.map(function (l) { return Object.assign({}, l); });
    localLines.forEach(function (line) {
      const match = merged.find(function (m) {
        return m.productId === line.productId && m.size === line.size && m.color === line.color;
      });
      if (match) match.qty += line.qty;
      else merged.push(Object.assign({}, line));
    });
    return merged;
  }

  // Called right after a successful login/signup: merges this
  // account's server-saved wishlist/cart with whatever's already in
  // this browser, then pushes the merged result back so every device
  // converges on the same data.
  function syncAfterLogin() {
    return api("/api/account", { method: "GET" }).then(function (data) {
      const localWishlist = window.KKCartAPI.getWishlistIds();
      const localCart = window.KKCartAPI.getCartLines();
      const mergedWishlist = mergeWishlist(data.wishlist || [], localWishlist);
      const mergedCart = mergeCart(data.cart || [], localCart);
      window.KKCartAPI.replaceWishlist(mergedWishlist, { silent: true });
      window.KKCartAPI.replaceCart(mergedCart, { silent: true });
      return pushToServer(); // save the merged result back
    });
  }

  function pushToServer() {
    if (!currentEmail) return Promise.resolve();
    return api("/api/account", {
      method: "PUT",
      body: JSON.stringify({
        wishlist: window.KKCartAPI.getWishlistIds(),
        cart: window.KKCartAPI.getCartLines(),
      }),
    }).catch(function (err) {
      console.warn("KK auth: failed to sync account data", err);
    });
  }

  // Hook read by cart.js's Cart.saveLines / Wishlist.saveIds — debounced
  // so rapid changes (e.g. adjusting quantity repeatedly) don't fire a
  // request per keystroke/click.
  window.KK_onAccountDataChange = function () {
    if (!currentEmail) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushToServer, 800);
  };

  /* ---------- Init ---------- */
  function init() {
    injectAccountIcon();
    api("/api/auth/me", { method: "GET" })
      .then(function (data) {
        if (data.loggedIn) {
          currentEmail = data.email;
          updateIcon();
          // Existing session on this device — pull + merge once so any
          // guest activity before the session was picked up isn't lost.
          return syncAfterLogin();
        }
      })
      .catch(function (err) {
        console.warn("KK auth: session check failed", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
