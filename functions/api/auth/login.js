import { verifyPassword, createSessionCookie, jsonResponse } from "../../_lib/session.js";

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
  if (!email || !password) return jsonResponse({ error: "Enter your email and password" }, 400);

  const raw = await env.KK_KV.get("user:" + email);
  if (!raw) return jsonResponse({ error: "No account found with this email" }, 401);

  const user = JSON.parse(raw);
  const ok = await verifyPassword(password, user.passwordHash, user.passwordSalt);
  if (!ok) return jsonResponse({ error: "Incorrect password" }, 401);

  const cookie = await createSessionCookie(email, env.SESSION_SECRET);
  return jsonResponse({ ok: true, email }, 200, { "set-cookie": cookie });
}
