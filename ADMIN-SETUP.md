# Catalog Admin — Setup Guide

This project adds a `/admin.html` page where you can add/remove products and edit
price + stock count without touching code. Changes save to Cloudflare KV
and show up on Home and Collections for every visitor (not just your
browser).

## One-time setup on Cloudflare Pages

1. **Create a KV namespace**
   Cloudflare dashboard → Storage & Databases → KV → Create namespace.
   Name it anything, e.g. `kk-catalog`.

2. **Bind it to your Pages project**
   Workers & Pages → your project → Settings → Functions → KV namespace
   bindings → Add binding.
   - Variable name: `KK_KV` (must match exactly)
   - KV namespace: the one you just created

3. **Set the admin password**
   Same project → Settings → Environment variables → Add variable.
   - Name: `ADMIN_PASSWORD`
   - Value: whatever password you want to use to save changes
   - Add it for both **Production** and **Preview**

4. **Redeploy**
   Bindings/env vars only apply to deployments made after you save them,
   so trigger a new deployment (push a commit, or "Retry deployment").

## Using it

- Go to `yoursite.com/admin.html`
- Type the password, click Unlock
- Edit price/stock/active per product inline, or "+ Add Product" for a
  new one, or "Delete" to remove one
- Click **Save Changes** — this is the point the password is actually
  checked (wrong password → "Unauthorized")
- Home and Collections pick up the change within a few seconds (next
  page load / refresh)

## What updates where

- **Collections page**: fully generated from this catalog now, so a new
  product appears there automatically, in the right collection.
- **Home page**: its featured sections are hand-laid-out HTML by design
  (curated look), so a brand-new product won't automatically appear
  there. But any product already featured on Home will automatically
  update its **image, price, and sold-out state**, and will disappear
  from Home if you delete it. It's also clickable now — clicking a card
  opens that product's page, not just the Add-to-Cart button.
- **Product detail / cart / WhatsApp checkout message**: always read the
  same catalog, so image, price, name, description, and sold-out state
  stay correct everywhere.

## Multiple images per product

Each product now supports 3–10+ images instead of just one. In the
product table, click **Manage** under "Images" to:
- Add an image (blank slot you can paste a URL into)
- Paste several URLs at once (one per line) and add them all together
- Reorder with ↑ / ↓
- Remove one with ✕

The first image in the list is always what shows as the thumbnail on
Home and Collections. On the product detail page, all of them show as
a click-through gallery (first one loads as the main image).

If you leave a product with no images yet, it'll show a broken-image
icon on the site until you add one — that's expected, not a bug.

## Root cause of the "image doesn't update everywhere" issue (fixed)

Previously, each page had its own leftover logic that only re-checked
**price and stock** after an admin save — never the image, name,
description, sizes, or colours. Collections page happened to look right
because it's fully rebuilt from scratch on every load; Home and Product
Detail were only ever "patched" for two fields, so an image change never
showed there. That's fixed at the root: every page now reads
`window.KK_PRODUCTS` — filled in from `/api/products` by
`assets/js/stock-sync.js`, which is the **only** thing that fetches the
catalog — and Product Detail's whole page now builds itself once, only
after that data has arrived, instead of building early from stale
bundled data and patching two fields on top of it.

## Notes / limits

- `admin.html` has `noindex` and isn't linked from the site nav, but
  it isn't hidden — anyone with the URL can open the editor. They just
  can't save anything without the password, since that's checked on the
  server. Don't share the URL or password publicly.
- There's no per-admin login/audit trail — it's a single shared password,
  fine for a small team.
- If you ever remove the KV binding or the env var, `/api/products`
  degrades gracefully: the site just falls back to whatever is hardcoded
  in `assets/js/products-data.js`.
