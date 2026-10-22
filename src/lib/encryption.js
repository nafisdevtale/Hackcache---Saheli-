// AES-GCM (256-bit) with a key derived from a 4-digit PIN via PBKDF2-SHA256.
// The PIN and the derived key are never stored. Each encryption uses a fresh
// random 96-bit IV. NOTE: a 4-digit PIN has only 10,000 combinations; the
// high work factor slows guessing but does not make the data invulnerable.
import { CONFIG } from "../config.js";

const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export const isValidPin = (p) => typeof p === "string" && /^\d{4}$/.test(p);
export const randomSaltB64 = () => b64(crypto.getRandomValues(new Uint8Array(16)));

export async function deriveKey(pin, saltB64, iterations = CONFIG.pbkdf2Iterations) {
  const base = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: unb64(saltB64), iterations, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false, // not extractable
    ["encrypt", "decrypt"],
  );
}

export async function encryptJSON(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(JSON.stringify(obj)),
  );
  return { enc: 1, alg: "AES-GCM", iv: b64(iv), ct: b64(ct) };
}

export async function decryptJSON(key, payload) {
  if (!isEncrypted(payload)) throw new Error("not-encrypted");
  let ivBytes, ctBytes;
  try {
    ivBytes = unb64(payload.iv);
    ctBytes = unb64(payload.ct);
  } catch {
    throw new Error("corrupt-ciphertext");
  }
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBytes }, key, ctBytes);
  try {
    return JSON.parse(dec.decode(pt));
  } catch {
    throw new Error("corrupt-payload");
  }
}

export const isEncrypted = (p) =>
  !!p && p.enc === 1 && typeof p.iv === "string" && typeof p.ct === "string";
