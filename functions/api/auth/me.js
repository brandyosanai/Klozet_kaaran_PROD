import { verifySessionCookie, jsonResponse } from "../../_lib/session.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const email = await verifySessionCookie(request.headers.get("cookie"), env.SESSION_SECRET);
  if (!email) return jsonResponse({ loggedIn: false }, 200);
  return jsonResponse({ loggedIn: true, email }, 200);
}
