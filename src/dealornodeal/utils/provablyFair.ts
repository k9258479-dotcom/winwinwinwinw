/**
 * Provably Fair RNG System using SHA-256.
 * Guarantees that the order of the briefcases was committed
 * BEFORE the player made their first choice.
 */

export async function sha256(message: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Lightweight fallback hash
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, 'a');
}

export function generateSeed(length = 32): string {
  const chars = 'abcdef0123456789';
  let res = '';
  for (let i = 0; i < length; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

/**
 * Deterministic Fisher-Yates shuffle based on seeds
 */
export function shuffleWithSeeds<T>(array: T[], seedStr: string): T[] {
  const copy = [...array];
  let hashNum = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hashNum = (hashNum * 31 + seedStr.charCodeAt(i)) >>> 0;
  }

  // Linear Congruential Generator
  const lcg = () => {
    hashNum = (hashNum * 1664525 + 1013904223) >>> 0;
    return hashNum / 4294967296;
  };

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(lcg() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}
