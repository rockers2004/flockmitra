/**
 * UUID v4 generation for offline-created records (AGENTS.md: use UUIDs for
 * records created offline).
 *
 * Uses the platform's crypto.randomUUID when present and falls back to a
 * Math.random-based v4 otherwise (Hermes environments without Web Crypto).
 * These values identify local rows — they are NOT security tokens, so the
 * fallback weakens no security property. A dedicated native dependency
 * (expo-crypto) was deliberately avoided for this reason.
 */

interface MaybeCrypto {
  readonly randomUUID?: () => string;
}

const HEX_DIGITS = '0123456789abcdef';

function randomHex(byteCount: number): string {
  let out = '';
  for (let i = 0; i < byteCount; i += 1) {
    const byte = Math.floor(Math.random() * 256);
    out += HEX_DIGITS[(byte >> 4) & 0x0f] + HEX_DIGITS[byte & 0x0f];
  }
  return out;
}

export function uuidV4(): string {
  const cryptoRef = (globalThis as { crypto?: MaybeCrypto }).crypto;
  if (typeof cryptoRef?.randomUUID === 'function') {
    return cryptoRef.randomUUID();
  }
  // RFC 4122 v4 layout: version nibble 4 at index 12, variant bits 10xx at index 16.
  const hex = randomHex(16).split('');
  hex[12] = '4';
  hex[16] = HEX_DIGITS[8 + (parseInt(hex[16], 16) & 0x03)];
  const value = hex.join('');
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20, 32)}`;
}
