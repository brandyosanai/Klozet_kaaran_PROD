/* ================================================
   KLOZET KAARAN — /api/products  (Cloudflare Pages Function)
   ================================================
   GET    -> public. Returns the live catalog saved by the admin
             panel, or { products: null } if nothing has been
             saved yet (client then falls back to the bundled
             assets/js/products-data.js defaults).
   PUT    -> admin only. Body: { products: {...}, collections: {...} }
             Requires header:  Authorization: Bearer <ADMIN_PASSWORD>
             Overwrites the whole catalog in KV.

   REQUIRED SETUP (Cloudflare Pages dashboard):
   1. Workers & Pages -> your project -> Settings -> Functions
      -> KV namespace bindings -> add binding named exactly
      "KK_KV" pointing at a KV namespace (create one first under
      Storage & Databases -> KV if you don't have one).
   2. Settings -> Environment variables -> add ADMIN_PASSWORD
      (Production AND Preview) with the password you'll type into
      /admin.html. Keep it secret — anyone with it can edit stock.
   3. Redeploy after adding the binding/variable (bindings only
      take effect on a fresh deployment).
================================================ */

const KV_KEY = "kk_catalog_v1";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.KK_KV) {
    return json({ products: null, error: "KK_KV binding not configured" }, 200);
  }
  const raw = await env.KK_KV.get(KV_KEY);
  if (!raw) return json({ products: null });
  try {
    return json(JSON.parse(raw));
  } catch (e) {
    return json({ products: null, error: "corrupt catalog in KV" }, 200);
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;

  if (!env.KK_KV) {
    return json({ error: "KK_KV binding not configured. See comment at top of this file." }, 500);
  }
  if (!env.ADMIN_PASSWORD) {
    return json({ error: "ADMIN_PASSWORD environment variable not set." }, 500);
  }

  const auth = request.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (token !== env.ADMIN_PASSWORD) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!body || typeof body.products !== "object" || body.products === null) {
    return json({ error: "Body must include a 'products' object" }, 400);
  }

  const payload = {
    products: body.products,
    collections: body.collections || null,
    updatedAt: new Date().toISOString(),
  };

  await env.KK_KV.put(KV_KEY, JSON.stringify(payload));
  return json({ ok: true, updatedAt: payload.updatedAt });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, PUT, OPTIONS",
      "access-control-allow-headers": "authorization, content-type",
    },
  });
}
