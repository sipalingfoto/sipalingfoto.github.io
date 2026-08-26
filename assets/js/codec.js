// Codec bersama SiPaling Foto: encoding ID issue & obfuscation blob profil.
// Sengaja tanpa API platform-spesifik agar bisa dipakai browser & Node.

const KEY = "SIPALINGFOTO_KEY_V1";
const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const M = 1n << 32n; // modulus 2^32
const A = 2654435761n; // pengali ganjil -> invertible mod 2^32
const B = 340573321n;

function textToBytes(text) {
  return new TextEncoder().encode(text);
}

function bytesToText(bytes) {
  return new TextDecoder().decode(bytes);
}

function xorWithKey(bytes) {
  const keyBytes = textToBytes(KEY);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return out;
}

export function bytesToBase64url(bytes) {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const hasB2 = i + 1 < bytes.length;
    const hasB3 = i + 2 < bytes.length;
    const b2 = hasB2 ? bytes[i + 1] : 0;
    const b3 = hasB3 ? bytes[i + 2] : 0;
    out += ALPHABET[b1 >> 2];
    out += ALPHABET[((b1 & 0b11) << 4) | (b2 >> 4)];
    if (hasB2) out += ALPHABET[((b2 & 0b1111) << 2) | (b3 >> 6)];
    if (hasB3) out += ALPHABET[b3 & 0b111111];
  }
  return out;
}

export function base64urlToBytes(str) {
  const vals = [];
  for (const ch of str) {
    const v = ALPHABET.indexOf(ch);
    if (v === -1) throw new Error(`karakter tidak valid: ${ch}`);
    vals.push(v);
  }
  if (vals.length === 1) throw new Error("panjang base64 tidak valid");
  const out = [];
  for (let i = 0; i < vals.length; i += 4) {
    const n = Math.min(4, vals.length - i);
    const c0 = vals[i];
    const c1 = vals[i + 1];
    out.push((c0 << 2) | (c1 >> 4));
    if (n >= 3) out.push(((c1 & 0b1111) << 4) | (vals[i + 2] >> 2));
    if (n >= 4) out.push(((vals[i + 2] & 0b11) << 6) | vals[i + 3]);
  }
  return Uint8Array.from(out);
}

function modInverse(a, m) {
  let [oldR, r] = [a, m];
  let [oldS, s] = [1n, 0n];
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  if (oldR !== 1n) throw new Error("tidak invertible");
  return ((oldS % m) + m) % m;
}

export function encodeId(n) {
  if (!Number.isInteger(n) || n < 1 || n >= 2 ** 32) {
    throw new Error(`ID tidak valid: ${n}`);
  }
  return ((BigInt(n) * A + B) % M).toString(36);
}

export function decodeId(code) {
  if (typeof code !== "string" || !/^[0-9a-z]{1,7}$/.test(code)) return null;
  const x = BigInt(parseInt(code, 36));
  if (x >= M) return null;
  const aInv = modInverse(A, M);
  const n = ((((x - B) % M + M) % M) * aInv) % M;
  return n === 0n ? null : Number(n);
}

export function obfuscate(value) {
  return bytesToBase64url(xorWithKey(textToBytes(JSON.stringify(value))));
}

export function deobfuscate(blob) {
  const bytes = xorWithKey(base64urlToBytes(blob));
  return JSON.parse(bytesToText(bytes));
}

const MARKER_OPEN = "<!-- sf-data -->";
const MARKER_CLOSE = "<!-- /sf-data -->";

export function wrapWithMarkers(blob) {
  return `${MARKER_OPEN}\n${blob}\n${MARKER_CLOSE}`;
}

export function extractBlob(issueBody) {
  const i = issueBody.indexOf(MARKER_OPEN);
  if (i === -1) return null;
  const start = i + MARKER_OPEN.length;
  const j = issueBody.indexOf(MARKER_CLOSE, start);
  if (j === -1) return null;
  return issueBody.slice(start, j).trim() || null;
}
