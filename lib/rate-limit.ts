// Minimal in-memory token bucket per key (IP). Good enough for a single
// long-lived Node process behind Tailscale Funnel; resets on restart.

type Bucket = { tokens: number; refilledAt: number };

const buckets = new Map<string, Bucket>();

const MAX_TOKENS = 5;
const REFILL_WINDOW_MS = 5 * 60 * 1000; // 5 tries per 5 minutes

export function consumeToken(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: MAX_TOKENS, refilledAt: now };

  const refills = Math.floor((now - bucket.refilledAt) / REFILL_WINDOW_MS);
  if (refills > 0) {
    bucket.tokens = MAX_TOKENS;
    bucket.refilledAt = now;
  }

  if (bucket.tokens <= 0) {
    buckets.set(key, bucket);
    return false;
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return true;
}
