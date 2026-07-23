# Catalog Admin — Setup Guide

This adds a `/admin.html` page where you can add/remove products and edit
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
  show "SOLD OUT" and the correct price if you change its stock/price
  in the admin, and will disappear from Home if you delete it.
- **Product detail / cart / WhatsApp checkout message**: always read the
  same catalog, so price and sold-out state stay correct everywhere.

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
