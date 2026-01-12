const buckets = new Map();

export function rateLimit({ key, limit, windowMs }) {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true };
  }

  if (now > entry.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= limit) return { ok: false };

  entry.count += 1;
  return { ok: true };
}
