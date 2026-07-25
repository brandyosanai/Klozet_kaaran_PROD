/* ================================================
   KLOZET KAARAN — AUTH HELPERS (shared)
   ================================================
   Used by functions/api/auth/*.js and functions/api/account.js.
   No external libraries — everything here uses the Web Crypto API,
   which is built into the Cloudflare Workers runtime.

   Password storage: PBKDF2 (100,000 iterations, SHA-256), random
   16-byte salt per user. Never store or log plain-text passwords.

   Sessions: a signed, stateless cookie — no server-side session
   store needed. The cookie is base64(JSON{email, exp}) + "." +
   HMAC-SHA256 signature, signed with the SESSION_SECRET environment
   variable (set this in Cloudflare Pages settings, same place as
   ADMIN_PASSWORD). Anyone without that secret can't forge a valid
   cookie; the server can verify one without hitting KV.
================================================ */

const encoder = new TextEncoder();

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

export async function hashPassword(password, existingSaltHex) {
  const salt = existingSaltHex ? fromHex(existingSaltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return { hash: toHex(bits), salt: toHex(salt) };
}

export async function verifyPassword(password, storedHash, storedSalt) {
  const check = await hashPassword(password, storedSalt);
  return check.hash === storedHash;
}

async function hmacSign(secret, data) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return toHex(sig);
}

const SESSION_DAYS = 30;
const COOKIE_NAME = "kk_session";

export async function createSessionCookie(email, secret) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payloadB64 = btoa(JSON.stringify({ email, exp }));
  const sig = await hmacSign(secret, payloadB64);
  const value = payloadB64 + "." + sig;
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 60 * 60}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

// Returns the logged-in user's email if the cookie is present and its
// signature/expiry check out, otherwise null. Never throws.
export async function verifySessionCookie(cookieHeader, secret) {
  if (!cookieHeader || !secret) return null;
  const match = cookieHeader.match(new RegExp("(?:^|;\\s*)" + COOKIE_NAME + "=([^;]+)"));
  if (!match) return null;
  const [payloadB64, sig] = match[1].split(".");
  if (!payloadB64 || !sig) return null;
  try {
    const expectedSig = await hmacSign(secret, payloadB64);
    if (expectedSig !== sig) return null;
    const payload = JSON.parse(atob(payloadB64));
    if (!payload.email || payload.exp < Date.now()) return null;
    return payload.email;
  } catch (e) {
    return null;
  }
}

export function jsonResponse(data, status, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign(
      { "content-type": "application/json", "cache-control": "no-store" },
      extraHeaders || {}
    ),
  });
}
