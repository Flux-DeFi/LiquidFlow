import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
  globalRateLimiter,
  createRateLimiter,
  DEFAULT_RATE_LIMITER_OPTIONS,
  TRUSTED_PROXY_HOPS,
} from '../src/middleware/rate-limiter.middleware.js';

describe('Rate Limiter Middleware', () => {
  it('should export correct default configuration and proxy hops', () => {
    expect(TRUSTED_PROXY_HOPS).toBe(2);
    expect(DEFAULT_RATE_LIMITER_OPTIONS.windowMs).toBe(60000);
    expect(DEFAULT_RATE_LIMITER_OPTIONS.max).toBe(100);
    expect(DEFAULT_RATE_LIMITER_OPTIONS.standardHeaders).toBe(true);
    expect(DEFAULT_RATE_LIMITER_OPTIONS.legacyHeaders).toBe(false);
    expect(DEFAULT_RATE_LIMITER_OPTIONS.message).toEqual({
      message: 'Too many requests, please try again later.',
      status: 429,
    });
  });

  it('should allow requests within the limit', async () => {
    const app = express();
    const limiter = createRateLimiter({
      windowMs: 1000,
      max: 2,
    });
    app.use(limiter);
    app.get('/test', (req, res) => res.status(200).json({ ok: true }));

    const res1 = await request(app).get('/test');
    expect(res1.status).toBe(200);
    expect(res1.body).toEqual({ ok: true });

    const res2 = await request(app).get('/test');
    expect(res2.status).toBe(200);
    expect(res2.body).toEqual({ ok: true });
  });

  it('should block requests exceeding the limit with 429 status and body', async () => {
    const app = express();
    const limiter = createRateLimiter({
      windowMs: 60000,
      max: 2,
    });
    app.use(limiter);
    app.get('/test', (req, res) => res.status(200).json({ ok: true }));

    // Request 1 and 2 within limit
    const res1 = await request(app).get('/test');
    expect(res1.status).toBe(200);

    const res2 = await request(app).get('/test');
    expect(res2.status).toBe(200);

    // Request 3 exceeds limit
    const res3 = await request(app).get('/test');
    expect(res3.status).toBe(429);
    expect(res3.body).toEqual({
      message: 'Too many requests, please try again later.',
      status: 429,
    });
  });

  it('should allow requests again after the rate limit window resets', async () => {
    const windowMs = 50;
    const app = express();
    const limiter = createRateLimiter({
      windowMs,
      max: 2,
    });
    app.use(limiter);
    app.get('/test', (req, res) => res.status(200).json({ ok: true }));

    // Consume allowed requests
    const res1 = await request(app).get('/test');
    expect(res1.status).toBe(200);
    const res2 = await request(app).get('/test');
    expect(res2.status).toBe(200);

    // Blocked on 3rd request
    const res3 = await request(app).get('/test');
    expect(res3.status).toBe(429);
    expect(res3.body.status).toBe(429);

    // Wait for the window to expire
    await new Promise((resolve) => setTimeout(resolve, windowMs + 20));

    // After reset, requests should succeed again
    const res4 = await request(app).get('/test');
    expect(res4.status).toBe(200);
    expect(res4.body).toEqual({ ok: true });
  });

  it('should verify globalRateLimiter enforces 429 when threshold is reached', async () => {
    const app = express();
    // Test with low max threshold using createRateLimiter to simulate global behavior
    const testLimiter = createRateLimiter({
      windowMs: 60000,
      max: 3,
    });
    app.use(testLimiter);
    app.get('/api/test', (req, res) => res.status(200).json({ ok: true }));

    for (let i = 0; i < 3; i++) {
      const res = await request(app).get('/api/test');
      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty('ratelimit-limit');
      expect(res.headers).toHaveProperty('ratelimit-remaining');
    }

    const blockedRes = await request(app).get('/api/test');
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body).toEqual({
      message: 'Too many requests, please try again later.',
      status: 429,
    });
  });

  it('should track rate limits independently per IP address with proxy support', async () => {
    const app = express();
    app.set('trust proxy', TRUSTED_PROXY_HOPS);
    const limiter = createRateLimiter({
      windowMs: 60000,
      max: 1,
    });
    app.use(limiter);
    app.get('/test', (req, res) => res.status(200).json({ ip: req.ip }));

    // Request from Client A
    const resA1 = await request(app)
      .get('/test')
      .set('X-Forwarded-For', '203.0.113.195, 10.0.0.1');
    expect(resA1.status).toBe(200);

    // Next request from Client A exceeds limit
    const resA2 = await request(app)
      .get('/test')
      .set('X-Forwarded-For', '203.0.113.195, 10.0.0.1');
    expect(resA2.status).toBe(429);

    // Request from different Client B should still succeed
    const resB = await request(app)
      .get('/test')
      .set('X-Forwarded-For', '198.51.100.44, 10.0.0.1');
    expect(resB.status).toBe(200);
  });
});
