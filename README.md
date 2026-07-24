# Klozet Kaaran — Full Setup Guide

Covers everything needed to get this project running: locally on your machine, and deployed live on Cloudflare Pages with its database (Cloudflare KV) wired up.

---

## 1. What this project actually is

A static HTML/CSS/JS site (no build step, no framework) with a small serverless backend layered on top:

- **Pages** — plain `.html` files (`index.html`, `services.html`, `about.html`, `contact.html`, `product-detail.html`)
- **Admin panel** — `admin.html`, lets you add/edit/delete products and stock counts without touching code
- **Backend** — `functions/api/products.js`, a single Cloudflare Pages Function that reads/writes the product catalog
- **Database** — Cloudflare KV (a simple key-value store), holds the catalog data the admin panel edits
- **Checkout** — WhatsApp deep links, no payment gateway, no traditional database for orders

There is no `npm run build`. What you see in the repo is what gets served.

---

## 2. Prerequisites

- **Node.js** (v18+) — only needed to run the local dev CLI, not for building anything
- **A Cloudflare account** (free tier is enough)
- **A GitHub account** — Cloudflare Pages deploys by connecting to a git repo
- **Wrangler** — Cloudflare's CLI, used for local development. Install once globally:
  ```
  npm install -g wrangler
  ```

---

## 3. Local development setup

Because `admin.html` depends on `functions/api/products.js` (a real serverless function, not just static files), opening `index.html` directly in a browser — or using a plain static server like `python -m http.server` — will **not** make the admin panel work locally. Product pages, Home, and Collections will still work fine that way if you just need to check layout/CSS, since they fall back to the bundled `assets/js/products-data.js` when the API isn't available.

**Option A — Just checking layout/CSS/pages (no admin panel needed)**
```
cd Klozet_kaaran_PROD
python3 -m http.server 8080
```
Open `http://localhost:8080` in your browser. Fast, zero setup, but `/admin.html` won't be able to save anything (no Functions running).

**Option B — Full local setup, including the admin panel + KV**
```
cd Klozet_kaaran_PROD
wrangler pages dev . --kv KK_KV
```
This spins up a local server that also emulates Cloudflare Functions and gives you a **local, temporary** KV namespace (data doesn't persist between restarts unless you add `--persist-to`). Wrangler will print a local URL (typically `http://localhost:8788`) — open that instead of using a plain static server.

To persist local KV data between restarts:
```
wrangler pages dev . --kv KK_KV --persist-to .wrangler/state
```
(`.wrangler/` is already in `.gitignore`, so this never gets committed.)

**Setting the admin password locally**
Create a `.env` file in the project root (already gitignored):
```
ADMIN_PASSWORD=whatever-you-want-locally
```
Wrangler picks this up automatically for local runs. This is separate from the password you'll set on the live Cloudflare Pages project later — they don't need to match.

---

## 4. Pushing to GitHub

If this is a brand new repo:
```
cd Klozet_kaaran_PROD
git init
git add .
git commit -m "Initial commit"
```

Create an empty repository on GitHub (don't initialize it with a README — you already have one), then:
```
git remote add origin https://github.com/yourusername/your-repo.git
git branch -M main
git push -u origin main
```

If you're pushing updates to an existing repo, it's just the usual:
```
git add .
git commit -m "describe what changed"
git push
```

---

## 5. Creating the Cloudflare Pages project

1. Cloudflare dashboard → **Workers & Pages** → **Create application** → **Pages** tab → **Connect to Git**
2. Authorize GitHub if you haven't already, then select your repo
3. Build settings:
   - **Framework preset**: None
   - **Build command**: *(leave blank — there's nothing to build)*
   - **Build output directory**: `/` (the repository root)
4. Click **Save and Deploy**

You'll get a live URL like `your-project-name.pages.dev`. At this point the site itself works, but the admin panel won't save anything yet — that needs the database wired up next.

---

## 6. Setting up the database (Cloudflare KV)

KV is Cloudflare's key-value store — this project uses one single key (`kk_catalog_v1`) to hold the entire product catalog as JSON.

1. Cloudflare dashboard → **Storage & Databases** → **KV** → **Create namespace**
2. Name it anything descriptive, e.g. `kk-catalog`
3. Click **Create**

That's it for creating it — nothing else to configure inside KV itself. The actual data gets written the first time you save something from `/admin.html`.

---

## 7. Setting up bindings

A "binding" is how your Pages Function actually gets access to the KV namespace and the admin password. Without this step, the API endpoint will error out even though the KV namespace exists.

1. Go to **Workers & Pages** → click into your Pages project → **Settings** → **Functions**
2. Scroll to **KV namespace bindings** → **Add binding**
   - **Variable name**: `KK_KV` *(must match this exactly — it's hardcoded in `functions/api/products.js`)*
   - **KV namespace**: select the `kk-catalog` namespace you just created
3. Still in **Settings**, go to **Environment variables** → **Add variable**
   - **Variable name**: `ADMIN_PASSWORD`
   - **Value**: choose a real password — this is what unlocks `/admin.html` on the live site
   - Add it for **both** Production and Preview environments (there are separate tabs/toggles for each)
4. **Redeploy** — bindings and environment variables only take effect on deployments made *after* you save them. Either push a new commit, or use the **Retry deployment** button on your most recent deployment in the Cloudflare dashboard.

---

## 8. Verifying everything works

After redeploying with the binding in place:

1. Visit `your-project-name.pages.dev/admin.html`
2. Enter the `ADMIN_PASSWORD` you set, click **Unlock**
3. Try editing a product's price or stock count, then **Save Changes**
   - Wrong password → you'll see "Unauthorized" — this is the one moment the password is actually checked
   - Success → the change should be visible if you refresh Home or Collections within a few seconds
4. If Collections/Home don't reflect the change, double check:
   - The binding variable name is exactly `KK_KV` (typos here are the most common cause of failures)
   - You redeployed *after* adding the binding, not before
   - `ADMIN_PASSWORD` is set for the environment you're actually testing (Production vs Preview)

---

## 9. Running a second/test environment safely

If you want to test changes (like mobile layout tweaks) without risking your live site or its saved catalog data:

- Push to a **separate GitHub repo**, and connect that to a **separate, new Cloudflare Pages project**
- KV bindings and environment variables are per-project — the new project starts with **none** of them configured, even if the code is identical
- If you only care about testing layout/CSS/JS, you can skip setting up KV on the test project entirely — Home and Collections fall back to the bundled static product data automatically when the API has nothing bound
- If you *do* want to test the admin panel too, repeat steps 6–7 on the new project with its own separate KV namespace — don't point two different Pages projects at the same KV namespace unless you deliberately want them sharing live data

When you're happy with changes made in a test repo, copy over only the specific files that actually changed into your production repo — never wholesale delete-and-replace, since that risks deleting files (like `admin.html` or `functions/`) that only exist in one of the two repos.

---

## 10. Common issues

| Symptom | Likely cause |
|---|---|
| Admin panel shows "Unauthorized" even with the right password | `ADMIN_PASSWORD` not set for the environment you're on, or set but not redeployed since |
| Changes saved in admin don't appear on the live site | KV binding variable name isn't exactly `KK_KV`, or wasn't redeployed after adding |
| Admin panel works locally but not live (or vice versa) | Local `.env` password and live `ADMIN_PASSWORD` are different — this is expected, not a bug, just don't confuse the two |
| A brand-new product added via admin doesn't show on the Home page | Expected — Home's featured sections are hand-laid-out by design. New products appear automatically on Collections; only *already-featured* products on Home auto-update their image/price/stock |
| Local dev shows a blank product catalog | You used a plain static server (Option A) instead of `wrangler pages dev` (Option B) — the Function never ran, so it's falling back to defaults, or KV is genuinely empty in that local session |
