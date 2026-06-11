type CacheEntry<T> = {
  expiresAt: number;
  value?: T;
  pending?: Promise<T>;
};

const cache = new Map<string, CacheEntry<unknown>>();

export type CacheOptions = {
  ttl?: number;
  skipCache?: boolean;
};

const DEFAULT_TTL = 35_000; // 35 seconds

export function buildCacheKey(prefix: string, params?: Record<string | number, unknown>) {
  if (!params || Object.keys(params).length === 0) {
    return prefix;
  }

  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}:${JSON.stringify(params[key])}`)
    .join('|');

  return `${prefix}:${sorted}`;
}

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  const ttl = options?.ttl ?? DEFAULT_TTL;
  const now = Date.now();
  const entry = cache.get(key);

  if (!options?.skipCache && entry && entry.expiresAt > now) {
    if (entry.value !== undefined) {
      return entry.value as T;
    }
    if (entry.pending) {
      return entry.pending as Promise<T>;
    }
  }

  const pending = fetcher()
    .then((value) => {
      cache.set(key, { expiresAt: Date.now() + ttl, value });
      return value;
    })
    .catch((error) => {
      cache.delete(key);
      throw error;
    });

  cache.set(key, { expiresAt: now + ttl, pending });
  return pending;
}

export function clearCache(key: string) {
  cache.delete(key);
}

export function clearAllCache() {
  cache.clear();
}
