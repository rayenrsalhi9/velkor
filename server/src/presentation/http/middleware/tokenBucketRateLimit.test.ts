import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TokenBucket, makeTokenBucketRateLimit } from "./tokenBucketRateLimit.js";
import type { Request, Response, NextFunction } from "express";

describe("TokenBucket", () => {
  it("consumes up to capacity, then refills at the configured rate", () => {
    let time = 0;
    const bucket = new TokenBucket(5, 0.5, () => time);

    for (let i = 0; i < 5; i++) {
      assert.equal(bucket.tryConsume(), true);
    }
    assert.equal(bucket.tryConsume(), false, "empty after capacity");

    time += 2_000; // +1 token at 0.5/s
    assert.equal(bucket.tryConsume(), true);
    assert.equal(bucket.tryConsume(), false, "single refilled token consumed");

    time += 200_000; // long pause → capped at capacity
    for (let i = 0; i < 5; i++) {
      assert.equal(bucket.tryConsume(), true);
    }
    assert.equal(bucket.tryConsume(), false);
  });
});

describe("makeTokenBucketRateLimit", () => {
  type FakeRes = {
    statusCode: number;
    status(code: number): FakeRes;
    json(_body: unknown): FakeRes;
    headers: Record<string, string>;
    setHeader(name: string, value: string): void;
  };

  function makeRes(): FakeRes & Response {
    const res: FakeRes = {
      statusCode: 200,
      headers: {},
      status(code) {
        this.statusCode = code;
        return this;
      },
      json() {
        return this;
      },
      setHeader(name, value) {
        this.headers[name] = value;
      },
    };
    return res as unknown as FakeRes & Response;
  }

  function makeReq(ip: string): Request {
    return { ip } as Request;
  }

  it("blocks the 6th request and clears after refill", () => {
    let time = 0;
    const limiter = makeTokenBucketRateLimit({ capacity: 5, refillRate: 0.5, now: () => time });

    for (let i = 0; i < 5; i++) {
      const req = makeReq("1.2.3.4");
      const res = makeRes();
      let nexted = false;
      limiter(req, res, () => {
        nexted = true;
      });
      assert.equal(nexted, true, `request ${i + 1} passes`);
      assert.equal(res.statusCode, 200);
    }

    const req = makeReq("1.2.3.4");
    const res = makeRes();
    let nexted = false;
    limiter(req, res, () => {
      nexted = true;
    });
    assert.equal(nexted, false, "6th request blocked");
    assert.equal(res.statusCode, 429);
    assert.equal(res.headers["Retry-After"], "2", "one token refills every 2s at 0.5/s");

    time += 2_000;
    const req2 = makeReq("1.2.3.4");
    const res2 = makeRes();
    let nexted2 = false;
    limiter(req2, res2, () => {
      nexted2 = true;
    });
    assert.equal(nexted2, true, "passes after one token refills");
  });

  it("tracks buckets per IP independently", () => {
    let time = 0;
    const limiter = makeTokenBucketRateLimit({ capacity: 5, refillRate: 0.5, now: () => time });

    for (let i = 0; i < 5; i++) {
      const res = makeRes();
      limiter(makeReq("a"), res, () => {});
    }
    const res = makeRes();
    let nexted = false;
    limiter(makeReq("b"), res, () => {
      nexted = true;
    });
    assert.equal(nexted, true, "fresh IP unaffected by exhausted IP");
    assert.equal(res.statusCode, 200);
  });

  it("evicts an idle bucket once a full refill period has passed", () => {
    let time = 0;
    const limiter = makeTokenBucketRateLimit({ capacity: 5, refillRate: 0.5, now: () => time });

    for (let i = 0; i < 5; i++) {
      limiter(makeReq("1.2.3.4"), makeRes(), () => {});
    }
    const blocked = makeRes();
    let nexted = false;
    limiter(makeReq("1.2.3.4"), blocked, () => {
      nexted = true;
    });
    assert.equal(nexted, false, "bucket exhausted");
    assert.equal(blocked.statusCode, 429);

    time += 11_000; // > capacity/refillRate (10s): sweep refills and evicts
    const revived = makeRes();
    let revivedNexted = false;
    limiter(makeReq("1.2.3.4"), revived, () => {
      revivedNexted = true;
    });
    assert.equal(revivedNexted, true, "evicted bucket is recreated fresh after refill");

    for (let i = 0; i < 4; i++) {
      limiter(makeReq("1.2.3.4"), makeRes(), () => {});
    }
    const again = makeRes();
    let againNexted = false;
    limiter(makeReq("1.2.3.4"), again, () => {
      againNexted = true;
    });
    assert.equal(againNexted, false, "fresh bucket only has capacity again");
    assert.equal(again.statusCode, 429);
  });
});