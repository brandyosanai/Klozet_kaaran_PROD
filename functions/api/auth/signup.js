import { hashPassword, createSessionCookie, jsonResponse } from "../../_lib/session.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.KK_KV) return jsonResponse({ error: "KK_KV binding not configured" }, 500);
  if (!env.SESSION_SECRET) return jsonResponse({ error: "SESSION_SECRET environment variable not set" }, 500);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!EMAIL_RE.test(email)) return jsonResponse({ error: "Enter a valid email address" }, 400);
  if (password.length < 6) return jsonResponse({ error: "Password must be at least 6 characters" }, 400);

  const kvKey = "user:" + email;
  const existing = await env.KK_KV.get(kvKey);
  if (existing) return jsonResponse({ error: "An account with this email already exists" }, 409);

  const { hash, salt } = await hashPassword(password);
  const user = {
    email,
    passwordHash: hash,
    passwordSalt: salt,
    wishlist: [],
    cart: [],
    createdAt: new Date().toISOString(),
  };
  await env.KK_KV.put(kvKey, JSON.stringify(user));

  const cookie = await createSessionCookie(email, env.SESSION_SECRET);
  return jsonResponse({ ok: true, email }, 200, { "set-cookie": cookie });
}
