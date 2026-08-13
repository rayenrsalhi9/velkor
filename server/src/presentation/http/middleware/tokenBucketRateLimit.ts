import type { Request, Response, NextFunction } from "express";

type TokenBucketOptions = {
  capacity: number;
  refillRate: number;
  now?: () => number;
};

export class TokenBucket {
  tokens: number;
  lastRefill: number;

  constructor(
    readonly capacity: number,
    readonly refillRate: number,
    private readonly now: () => number,
  ) {
    this.tokens = capacity;
    this.lastRefill = now();
  }

  tryConsume(): boolean {
    const now = this.now();
    this.tokens = Math.min(this.capacity, this.tokens + ((now - this.lastRefill) / 1000) * this.refillRate);
    this.lastRefill = now;
    if (this.tokens < 1) {
      return false;
    }
    this.tokens -= 1;
    return true;
  }

  refillTime(): number {
    return Math.ceil((1 - this.tokens) / this.refillRate);
  }
}

export function makeTokenBucketRateLimit(options: TokenBucketOptions) {
  const now = options.now ?? Date.now;
  const buckets = new Map<string, TokenBucket>();
  let lastSweep = now();

  return function tokenBucketRateLimit(req: Request, res: Response, next: NextFunction) {
    const current = now();
    if (current - lastSweep > options.capacity / options.refillRate) {
      for (const [key, bucket] of buckets) {
        if (bucket.tokens >= bucket.capacity) {
          buckets.delete(key);
        }
      }
      lastSweep = current;
    }
    const key = req.ip ?? "unknown";
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = new TokenBucket(options.capacity, options.refillRate, now);
      buckets.set(key, bucket);
    }
    if (!bucket.tryConsume()) {
      res.setHeader("Retry-After", String(bucket.refillTime()));
      res.status(429).json({ error: "Too many requests, slow down." });
      return;
    }
    next();
  };
}