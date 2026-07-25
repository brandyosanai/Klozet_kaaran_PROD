import { verifySessionCookie, jsonResponse } from "../_lib/session.js";

async function requireUser(request, env) {
  const email = await verifySessionCookie(request.headers.get("cookie"), env.SESSION_SECRET);
  if (!email) return { error: jsonResponse({ error: "Not logged in" }, 401) };
  const raw = await env.KK_KV.get("user:" + email);
  if (!raw) return { error: jsonResponse({ error: "Account not found" }, 404) };
  return { email, user: JSON.parse(raw) };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.KK_KV) return jsonResponse({ error: "KK_KV binding not configured" }, 500);

  const result = await requireUser(request, env);
  if (result.error) return result.error;

  return jsonResponse({
    wishlist: Array.isArray(result.user.wishlist) ? result.user.wishlist : [],
    cart: Array.isArray(result.user.cart) ? result.user.cart : [],
  });
}

export async function onRequestPut(context) {
  const { request, env } = context;
  if (!env.KK_KV) return jsonResponse({ error: "KK_KV binding not configured" }, 500);

  const result = await requireUser(request, env);
  if (result.error) return result.error;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const user = result.user;
  if (Array.isArray(body.wishlist)) user.wishlist = body.wishlist;
  if (Array.isArray(body.cart)) user.cart = body.cart;
  user.updatedAt = new Date().toISOString();

  await env.KK_KV.put("user:" + result.email, JSON.stringify(user));
  return jsonResponse({ ok: true });
}
