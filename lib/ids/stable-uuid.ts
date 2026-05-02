import { createHash } from "node:crypto";

export function stableUuidFromString(input: string): string {
  // Deterministic UUID derived from SHA-256(input). We set RFC4122 variant + v5 bits.
  const hash = createHash("sha256").update(input).digest();
  const bytes = hash.subarray(0, 16);

  // version (0101)
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  // variant (10xx)
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Buffer.from(bytes).toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}
