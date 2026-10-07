export interface RateLimiter {
  /** Beleži pokušaj; vraća `false` kada je ključ (IP adresa) prekoračio dozvoljeni broj u prozoru. */
  hit(key: string): boolean;
}

interface Window {
  count: number;
  resetAt: number;
}

const PRUNE_THRESHOLD = 1000;

/**
 * Jednostavan rate limit u memoriji procesa (fiksni vremenski prozor po ključu).
 * Dovoljan za jednu instancu servera; kod više instanci svaka broji zasebno.
 */
export function createRateLimiter(options: {
  max: number;
  windowMs: number;
  now?: () => number;
}): RateLimiter {
  const { max, windowMs, now = Date.now } = options;
  const windows = new Map<string, Window>();

  const prune = (time: number) => {
    for (const [key, entry] of windows) {
      if (entry.resetAt <= time) windows.delete(key);
    }
  };

  return {
    hit(key) {
      const time = now();
      if (windows.size > PRUNE_THRESHOLD) prune(time);

      const entry = windows.get(key);
      if (!entry || entry.resetAt <= time) {
        windows.set(key, { count: 1, resetAt: time + windowMs });
        return true;
      }
      entry.count += 1;
      return entry.count <= max;
    },
  };
}
